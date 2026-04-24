from app.database import fetch_all
from app.services.content_model import get_content_scores_for_user, build_content_model
from app.services.collaborative_model import (
    get_collaborative_scores,
    get_user_play_count,
    get_listened_song_ids,
    build_collaborative_model,
)


def _get_user_genre_weights(user_id: str) -> dict:
    rows = fetch_all("""
        SELECT "genreId", weight
        FROM "UserPreference"
        WHERE "userId" = :user_id
    """, {"user_id": user_id})
    return {r["genreId"]: float(r["weight"]) for r in rows}


def get_recommendations(user_id: str, n: int = 20) -> list[str]:
    """
    Hybrid recommendation:
    - <10 plays  → 100% content-based
    - 10–50 plays → 40% content + 60% collaborative
    - >50 plays  → 20% content + 80% collaborative
    """
    play_count = get_user_play_count(user_id)
    listened = get_listened_song_ids(user_id)

    if play_count < 10:
        content_w, collab_w = 1.0, 0.0
    elif play_count <= 50:
        content_w, collab_w = 0.4, 0.6
    else:
        content_w, collab_w = 0.2, 0.8

    genre_weights = _get_user_genre_weights(user_id)

    # No preferences yet → return popular songs directly
    if not genre_weights and collab_w == 0.0:
        rows = fetch_all("""
            SELECT id FROM "Song"
            WHERE status = 'published'
            ORDER BY "playCount" DESC
            LIMIT :n
        """, {"n": n + len(listened)})
        return [r["id"] for r in rows if r["id"] not in listened][:n]

    content_scores = dict(get_content_scores_for_user(genre_weights, n=100))

    collab_scores = {}
    if collab_w > 0:
        collab_scores = dict(get_collaborative_scores(user_id, n=100))

    # Merge all known song_ids
    all_songs = set(content_scores.keys()) | set(collab_scores.keys())

    combined = {}
    for sid in all_songs:
        if sid in listened:
            continue
        c = content_scores.get(sid, 0.0)
        k = collab_scores.get(sid, 0.0)
        combined[sid] = content_w * c + collab_w * k

    sorted_songs = sorted(combined.items(), key=lambda x: x[1], reverse=True)
    return [sid for sid, _ in sorted_songs[:n]]


def warmup():
    """Pre-build both models at startup."""
    build_content_model()
    build_collaborative_model()
