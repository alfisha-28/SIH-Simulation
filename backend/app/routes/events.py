from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.schemas.event import EventListResponse, EventDetail
from app.services import queries

router = APIRouter(prefix="/events", tags=["events"])


@router.get("", response_model=EventListResponse)
@router.get("/", response_model=EventListResponse, include_in_schema=False)
def get_events(db: Session = Depends(get_db)):
    events = queries.get_all_events(db)
    return EventListResponse(events=events)


@router.get("/{event_id}", response_model=EventDetail)
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    event_detail = queries.get_event_detail(db, event_id)
    if not event_detail:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return event_detail
