from fastapi import APIRouter

router = APIRouter(prefix="/risk", tags=["risk"])

@router.get("")
@router.get("/")
def get_risk_placeholder():
    return {"message": "not implemented yet"}
