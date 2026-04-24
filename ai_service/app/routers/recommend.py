from fastapi import APIRouter, Query, HTTPException
from app.services.hybrid_engine import get_recommendations
from app.database import fetch_all

router = APIRouter(prefix="/recommend", tags=["recommend"])


@router.get("")
def recommend(user_id: str = Query(..., description="User UUID")):
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    # Verify user exists
    rows = fetch_all('SELECT id FROM "User" WHERE id = :uid', {"uid": user_id})
    if not rows:
        raise HTTPException(status_code=404, detail="User not found")

    song_ids = get_recommendations(user_id, n=20)
    return {"user_id": user_id, "song_ids": song_ids}
