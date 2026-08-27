from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.risk import RiskResponse, GeoRiskResponse
from app.services import queries

router = APIRouter(tags=["risk"])


@router.get("/events/{event_id}/risk", response_model=RiskResponse)
def get_event_risk(
    event_id: str,
    timestep: Optional[str] = Query(
        None, description="Timestep label e.g. NOW, +6h, +12h, +18h"
    ),
    db: Session = Depends(get_db),
):
    risk = queries.get_event_risk(db, event_id, timestep)
    if not risk:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return risk


@router.get("/risk", response_model=GeoRiskResponse)
@router.get("/risk/", response_model=GeoRiskResponse, include_in_schema=False)
def get_geo_risk(
    lat: float = Query(..., description="Latitude coordinate"),
    lon: float = Query(..., description="Longitude coordinate"),
    db: Session = Depends(get_db),
):
    return queries.get_geo_risk(db, lat, lon)
