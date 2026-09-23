from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from app.schemas.event import Centroid, BBox
from app.schemas.common import UtcDatetime


class CoarseWeatherField(BaseModel):
    resolution_km: float = 12.0
    rainfall_mm: Optional[float] = None
    temperature_c: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    pressure_hpa: Optional[float] = None
    humidity_pct: Optional[float] = None
    efi: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class DownscaledWeatherField(BaseModel):
    resolution_km: float = 5.0
    rainfall_mm: Optional[float] = None
    peak_rainfall_mm: Optional[float] = None
    max_intensity_mmhr: Optional[float] = None
    extreme_preservation_pct: Optional[float] = None
    model_confidence: Optional[str] = None
    temperature_c: Optional[float] = None
    wind_speed_kmh: Optional[float] = None
    pressure_hpa: Optional[float] = None
    humidity_pct: Optional[float] = None
    efi: Optional[float] = None

    model_config = ConfigDict(from_attributes=True)


class TrajectoryPointResponse(BaseModel):
    timestep_label: str
    timestep_hours_offset: int
    timestamp: UtcDatetime
    centroid: Centroid
    intensity: float
    probability: float
    uncertainty_radius_km: float
    bbox: BBox
    risk_level: str
    coarse: Optional[CoarseWeatherField] = None
    downscaled: Optional[DownscaledWeatherField] = None

    model_config = ConfigDict(from_attributes=True)


class ForecastResponse(BaseModel):
    event_id: str
    timeline: List[TrajectoryPointResponse]

    model_config = ConfigDict(from_attributes=True)
