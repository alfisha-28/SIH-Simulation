from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.forecast import ForecastResponse
from app.services import queries

router = APIRouter(prefix="/events/{event_id}/forecast", tags=["forecast"])


@router.get("", response_model=ForecastResponse)
@router.get("/", response_model=ForecastResponse, include_in_schema=False)
def get_event_forecast(event_id: str, db: Session = Depends(get_db)):
    forecast = queries.get_event_forecast(db, event_id)
    if not forecast:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return forecast
