from typing import List
from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import UtcDatetime


class Centroid(BaseModel):
    lat: float
    lon: float


class BBox(BaseModel):
    min_lat: float
    min_lon: float
    max_lat: float
    max_lon: float


class EFIBreakdown(BaseModel):
    rainfall: float
    temperature: float
    wind: float


class Movement(BaseModel):
    direction: str
    speed_kmh: float


class EventSummary(BaseModel):
    event_id: str = Field(..., validation_alias="id")
    type: str
    location_name: str
    severity: str
    probability: float
    status: str
    confidence: str
    centroid_lat: float
    centroid_lon: float
    ensemble_agreement: float
    movement_direction: str
    movement_speed_kmh: float
    detected_at: UtcDatetime
    forecast_lead_time_hours: int

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class EventDetail(BaseModel):
    event_id: str = Field(..., validation_alias="id")
    type: str
    location_name: str
    severity: str
    probability: float
    status: str
    confidence: str
    centroid: Centroid
    centroid_lat: float
    centroid_lon: float
    bbox: BBox
    rainfall_efi: float
    temperature_efi: float
    wind_efi: float
    efi_breakdown: EFIBreakdown
    ensemble_agreement: float
    movement: Movement
    movement_direction: str
    movement_speed_kmh: float
    forecast_lead_time_hours: int
    detected_at: UtcDatetime
    created_at: UtcDatetime

    model_config = ConfigDict(from_attributes=True, populate_by_name=True)


class EventListResponse(BaseModel):
    events: List[EventSummary]
