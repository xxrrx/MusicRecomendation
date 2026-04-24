from fastapi import APIRouter, Query, HTTPException
from app.services.content_model import get_similar_songs
from app.database import fetch_all

router = APIRouter(prefix="/radio", tags=["radio"])


@router.get("")
def radio(song_id: str = Query(..., description="Song UUID")):
    if not song_id:
        raise HTTPException(status_code=400, detail="song_id is required")

    rows = fetch_all(
        'SELECT id FROM "Song" WHERE id = :sid AND status = \'published\'',
        {"sid": song_id},
    )
    if not rows:
        raise HTTPException(status_code=404, detail="Song not found")

    similar_ids = get_similar_songs(song_id, n=20)
    return {"song_id": song_id, "song_ids": similar_ids}
