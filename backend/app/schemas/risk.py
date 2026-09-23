from typing import Optional
from pydantic import BaseModel, ConfigDict

from app.schemas.common import UtcDatetime


class RiskSnapshot(BaseModel):
    event_id: str
    timestep_label: str
    overall_risk: str
    flood_risk_level: str
    flood_risk_probability: float
    wind_risk_level: str
    wind_risk_probability: float
    heat_risk_level: str
    heat_risk_probability: float
    impact_radius_km: float
    impact_region_name: str
    expected_start: UtcDatetime
    peak_period: UtcDatetime
    expected_end: UtcDatetime

    model_config = ConfigDict(from_attributes=True)


RiskResponse = RiskSnapshot


class GeoRiskResponse(BaseModel):
    risk: str
    probability: float
    primary_threat: str
    nearest_event_id: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
