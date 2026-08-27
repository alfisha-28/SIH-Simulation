from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.db import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(String, primary_key=True, index=True)  # e.g. "EVT-2026-001"
    type = Column(String, nullable=False)  # extreme_rainfall | high_wind | extreme_heat
    status = Column(String, nullable=False)  # active | dissipating | resolved
    location_name = Column(String, nullable=False)  # e.g. "Gujarat"
    centroid_lat = Column(Float, nullable=False)
    centroid_lon = Column(Float, nullable=False)
    severity = Column(String, nullable=False)  # low | moderate | severe
    probability = Column(Float, nullable=False)  # 0-1
    confidence = Column(String, nullable=False)  # low | moderate | high
    rainfall_efi = Column(Float, nullable=False)  # 0-1
    temperature_efi = Column(Float, nullable=False)  # 0-1
    wind_efi = Column(Float, nullable=False)  # 0-1
    ensemble_agreement = Column(Float, nullable=False)  # 0-1
    movement_direction = Column(String, nullable=False)  # e.g. "NE_E"
    movement_speed_kmh = Column(Float, nullable=False)
    forecast_lead_time_hours = Column(Integer, nullable=False)
    detected_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships with cascade delete
    trajectory_points = relationship(
        "TrajectoryPoint",
        back_populates="event",
        cascade="all, delete-orphan",
        order_by="TrajectoryPoint.timestep_hours_offset",
    )
    weather_fields = relationship(
        "WeatherField",
        back_populates="event",
        cascade="all, delete-orphan",
    )
    risks = relationship(
        "Risk",
        back_populates="event",
        cascade="all, delete-orphan",
    )


class TrajectoryPoint(Base):
    __tablename__ = "trajectory_points"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    timestep_label = Column(String, nullable=False)  # "NOW" | "+6h" | "+12h" | "+18h" | "+24h" | "+48h"
    timestep_hours_offset = Column(Integer, nullable=False)  # 0, 6, 12, 18, 24, 48
    timestamp = Column(DateTime, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    intensity = Column(Float, nullable=False)
    probability = Column(Float, nullable=False)  # 0-1
    uncertainty_radius_km = Column(Float, nullable=False)
    bbox_min_lat = Column(Float, nullable=False)
    bbox_min_lon = Column(Float, nullable=False)
    bbox_max_lat = Column(Float, nullable=False)
    bbox_max_lon = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False)  # low | moderate | high | severe

    event = relationship("Event", back_populates="trajectory_points")


class WeatherField(Base):
    __tablename__ = "weather_fields"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    timestep_label = Column(String, nullable=False)
    resolution_km = Column(Float, nullable=False)  # 12.0 or 5.0
    rainfall_mm = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    efi = Column(Float, nullable=True)
    peak_rainfall_mm = Column(Float, nullable=True)  # only meaningful on 5km rows
    max_intensity_mmhr = Column(Float, nullable=True)
    extreme_preservation_pct = Column(Float, nullable=True)  # only meaningful on 5km rows
    model_confidence = Column(String, nullable=True)

    event = relationship("Event", back_populates="weather_fields")


class Risk(Base):
    __tablename__ = "risks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    event_id = Column(
        String, ForeignKey("events.id", ondelete="CASCADE"), nullable=False
    )
    timestep_label = Column(String, nullable=False)
    overall_risk = Column(String, nullable=False)  # low | moderate | high | severe
    flood_risk_level = Column(String, nullable=False)
    flood_risk_probability = Column(Float, nullable=False)  # 0-1
    wind_risk_level = Column(String, nullable=False)
    wind_risk_probability = Column(Float, nullable=False)  # 0-1
    heat_risk_level = Column(String, nullable=False)
    heat_risk_probability = Column(Float, nullable=False)  # 0-1
    impact_radius_km = Column(Float, nullable=False)
    impact_region_name = Column(String, nullable=False)
    expected_start = Column(DateTime, nullable=False)
    peak_period = Column(DateTime, nullable=False)
    expected_end = Column(DateTime, nullable=False)

    event = relationship("Event", back_populates="risks")
