import math
from typing import List, Optional
from sqlalchemy import case
from sqlalchemy.orm import Session

from app.models import Event, TrajectoryPoint, WeatherField, Risk
from app.schemas.event import (
    EventDetail,
    EventSummary,
    Centroid,
    BBox,
    EFIBreakdown,
    Movement,
)
from app.schemas.forecast import (
    ForecastResponse,
    TrajectoryPointResponse,
    CoarseWeatherField,
    DownscaledWeatherField,
)
from app.schemas.risk import RiskResponse, GeoRiskResponse


def get_all_events(db: Session) -> List[EventSummary]:
    """
    Query all events, ordered by severity (severe first, moderate, low)
    then probability (descending).
    """
    events = (
        db.query(Event)
        .order_by(
            case(
                (Event.severity == "severe", 1),
                (Event.severity == "moderate", 2),
                (Event.severity == "low", 3),
                else_=4,
            ),
            Event.probability.desc(),
        )
        .all()
    )
    return [EventSummary.model_validate(e) for e in events]


def get_event_detail(db: Session, event_id: str) -> Optional[EventDetail]:
    """
    Get full details for a single event by ID.
    BBox is derived from the NOW trajectory point if available.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None

    # Find NOW trajectory point for bbox
    now_tp = (
        db.query(TrajectoryPoint)
        .filter(
            TrajectoryPoint.event_id == event_id,
            TrajectoryPoint.timestep_label == "NOW",
        )
        .first()
    )
    if not now_tp:
        # Fallback to first trajectory point if NOW is missing
        now_tp = (
            db.query(TrajectoryPoint)
            .filter(TrajectoryPoint.event_id == event_id)
            .order_by(TrajectoryPoint.timestep_hours_offset)
            .first()
        )

    if now_tp:
        bbox = BBox(
            min_lat=now_tp.bbox_min_lat,
            min_lon=now_tp.bbox_min_lon,
            max_lat=now_tp.bbox_max_lat,
            max_lon=now_tp.bbox_max_lon,
        )
    else:
        # Fallback if no trajectory point exists at all
        bbox = BBox(
            min_lat=round(event.centroid_lat - 0.2, 3),
            min_lon=round(event.centroid_lon - 0.2, 3),
            max_lat=round(event.centroid_lat + 0.2, 3),
            max_lon=round(event.centroid_lon + 0.2, 3),
        )

    centroid = Centroid(lat=event.centroid_lat, lon=event.centroid_lon)
    efi_breakdown = EFIBreakdown(
        rainfall=event.rainfall_efi,
        temperature=event.temperature_efi,
        wind=event.wind_efi,
    )
    movement = Movement(
        direction=event.movement_direction,
        speed_kmh=event.movement_speed_kmh,
    )

    return EventDetail(
        event_id=event.id,
        type=event.type,
        location_name=event.location_name,
        severity=event.severity,
        probability=event.probability,
        status=event.status,
        confidence=event.confidence,
        centroid=centroid,
        centroid_lat=event.centroid_lat,
        centroid_lon=event.centroid_lon,
        bbox=bbox,
        rainfall_efi=event.rainfall_efi,
        temperature_efi=event.temperature_efi,
        wind_efi=event.wind_efi,
        efi_breakdown=efi_breakdown,
        ensemble_agreement=event.ensemble_agreement,
        movement=movement,
        movement_direction=event.movement_direction,
        movement_speed_kmh=event.movement_speed_kmh,
        forecast_lead_time_hours=event.forecast_lead_time_hours,
        detected_at=event.detected_at,
        created_at=event.created_at,
    )


def get_event_forecast(db: Session, event_id: str) -> Optional[ForecastResponse]:
    """
    Get full forecast timeline for an event.
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None

    tps = (
        db.query(TrajectoryPoint)
        .filter(TrajectoryPoint.event_id == event_id)
        .order_by(TrajectoryPoint.timestep_hours_offset.asc())
        .all()
    )

    wfs = db.query(WeatherField).filter(WeatherField.event_id == event_id).all()
    weather_map = {}
    for wf in wfs:
        weather_map[(wf.timestep_label, wf.resolution_km)] = wf

    timeline = []
    for tp in tps:
        wf12 = weather_map.get((tp.timestep_label, 12.0))
        wf5 = weather_map.get((tp.timestep_label, 5.0))

        coarse_field = None
        if wf12:
            coarse_field = CoarseWeatherField(
                resolution_km=wf12.resolution_km,
                rainfall_mm=wf12.rainfall_mm,
                temperature_c=wf12.temperature_c,
                wind_speed_kmh=wf12.wind_speed_kmh,
                pressure_hpa=wf12.pressure_hpa,
                humidity_pct=wf12.humidity_pct,
                efi=wf12.efi,
            )

        downscaled_field = None
        if wf5:
            downscaled_field = DownscaledWeatherField(
                resolution_km=wf5.resolution_km,
                rainfall_mm=wf5.rainfall_mm,
                peak_rainfall_mm=wf5.peak_rainfall_mm,
                max_intensity_mmhr=wf5.max_intensity_mmhr,
                extreme_preservation_pct=wf5.extreme_preservation_pct,
                model_confidence=wf5.model_confidence,
                temperature_c=wf5.temperature_c,
                wind_speed_kmh=wf5.wind_speed_kmh,
                pressure_hpa=wf5.pressure_hpa,
                humidity_pct=wf5.humidity_pct,
                efi=wf5.efi,
            )

        tp_res = TrajectoryPointResponse(
            timestep_label=tp.timestep_label,
            timestep_hours_offset=tp.timestep_hours_offset,
            timestamp=tp.timestamp,
            centroid=Centroid(lat=tp.lat, lon=tp.lon),
            intensity=tp.intensity,
            probability=tp.probability,
            uncertainty_radius_km=tp.uncertainty_radius_km,
            bbox=BBox(
                min_lat=tp.bbox_min_lat,
                min_lon=tp.bbox_min_lon,
                max_lat=tp.bbox_max_lat,
                max_lon=tp.bbox_max_lon,
            ),
            risk_level=tp.risk_level,
            coarse=coarse_field,
            downscaled=downscaled_field,
        )
        timeline.append(tp_res)

    return ForecastResponse(event_id=event_id, timeline=timeline)


def get_event_risk(
    db: Session, event_id: str, timestep: Optional[str] = None
) -> Optional[RiskResponse]:
    """
    Get risk snapshot for an event at specified timestep (default "NOW").
    Falls back to available snapshot if requested timestep doesn't exist.
    Handles URL decoding of leading '+' in timestep labels (e.g. '+18h').
    """
    event = db.query(Event).filter(Event.id == event_id).first()
    if not event:
        return None

    target_timestep = "NOW"
    if timestep:
        s = timestep.strip()
        if not s.startswith("+") and s.endswith("h") and s[:-1].isdigit():
            s = "+" + s
        target_timestep = s

    risk_obj = (
        db.query(Risk)
        .filter(Risk.event_id == event_id, Risk.timestep_label == target_timestep)
        .first()
    )

    if not risk_obj:
        # Fallback to "NOW" snapshot if available
        risk_obj = (
            db.query(Risk)
            .filter(Risk.event_id == event_id, Risk.timestep_label == "NOW")
            .first()
        )

    if not risk_obj:
        # Fallback to any snapshot for this event
        risk_obj = (
            db.query(Risk)
            .filter(Risk.event_id == event_id)
            .first()
        )

    if not risk_obj:
        return None

    return RiskResponse.model_validate(risk_obj)


def get_geo_risk(
    db: Session, lat: float, lon: float, threshold_deg: float = 3.5
) -> GeoRiskResponse:
    """
    Find nearest event by Euclidean distance.
    If within threshold_deg, return that event's risk info, else low risk fallback.
    """
    events = db.query(Event).all()
    if not events:
        return GeoRiskResponse(
            risk="low",
            probability=0.05,
            primary_threat="none",
            nearest_event_id=None,
        )

    nearest_event = None
    min_dist = float("inf")

    for event in events:
        dist = math.sqrt(
            (event.centroid_lat - lat) ** 2 + (event.centroid_lon - lon) ** 2
        )
        if dist < min_dist:
            min_dist = dist
            nearest_event = event

    if nearest_event and min_dist <= threshold_deg:
        risk_obj = (
            db.query(Risk)
            .filter(
                Risk.event_id == nearest_event.id,
                Risk.timestep_label == "NOW",
            )
            .first()
        )
        if not risk_obj:
            risk_obj = (
                db.query(Risk)
                .filter(Risk.event_id == nearest_event.id)
                .first()
            )

        if risk_obj:
            threats = [
                ("flash_flood", risk_obj.flood_risk_probability),
                ("high_wind", risk_obj.wind_risk_probability),
                ("extreme_heat", risk_obj.heat_risk_probability),
            ]
            primary_threat = max(threats, key=lambda x: x[1])[0]
            max_prob = max(
                risk_obj.flood_risk_probability,
                risk_obj.wind_risk_probability,
                risk_obj.heat_risk_probability,
            )

            return GeoRiskResponse(
                risk=risk_obj.overall_risk,
                probability=max_prob,
                primary_threat=primary_threat,
                nearest_event_id=nearest_event.id,
            )
        else:
            type_threat_map = {
                "extreme_rainfall": "flash_flood",
                "high_wind": "high_wind",
                "extreme_heat": "extreme_heat",
            }
            return GeoRiskResponse(
                risk=nearest_event.severity,
                probability=nearest_event.probability,
                primary_threat=type_threat_map.get(nearest_event.type, "none"),
                nearest_event_id=nearest_event.id,
            )

    return GeoRiskResponse(
        risk="low",
        probability=0.05,
        primary_threat="none",
        nearest_event_id=None,
    )
