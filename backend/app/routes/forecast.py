from fastapi import APIRouter

router = APIRouter(prefix="/events/{event_id}/forecast", tags=["forecast"])

@router.get("")
@router.get("/")
def get_forecast_placeholder(event_id: str):
    return {"message": "not implemented yet"}
