from fastapi import APIRouter

router = APIRouter(prefix="/events", tags=["events"])

@router.get("")
@router.get("/")
def get_events_placeholder():
    return {"message": "not implemented yet"}

@router.get("/{event_id}")
def get_event_detail_placeholder(event_id: str):
    return {"message": "not implemented yet"}
