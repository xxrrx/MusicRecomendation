import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
from sklearn.metrics.pairwise import cosine_similarity
from app.database import fetch_all

_similarity_matrix = None
_song_index = None  # song_id -> row index
_song_ids = None    # list of song_ids in order


def _load_songs():
    rows = fetch_all("""
        SELECT s.id, s."genreId", s.bpm, s.mood, s.key, s.duration
        FROM "Song" s
        WHERE s.status = 'published'
    """)
    return pd.DataFrame(rows)


def _build_features(df: pd.DataFrame) -> np.ndarray:
    # One-hot encode categorical features
    genre_dummies = pd.get_dummies(df["genreId"], prefix="genre")
    mood_dummies = pd.get_dummies(df["mood"], prefix="mood")
    key_dummies = pd.get_dummies(df["key"], prefix="key")

    # Normalize numeric features
    numeric = df[["bpm", "duration"]].copy()
    numeric["bpm"] = numeric["bpm"].fillna(numeric["bpm"].mean())
    numeric["duration"] = numeric["duration"].fillna(numeric["duration"].mean())
    scaler = MinMaxScaler()
    numeric_scaled = pd.DataFrame(
        scaler.fit_transform(numeric),
        columns=numeric.columns,
        index=df.index,
    )

    features = pd.concat([genre_dummies, mood_dummies, key_dummies, numeric_scaled], axis=1)
    return features.values.astype(float)


def build_content_model():
    global _similarity_matrix, _song_index, _song_ids

    df = _load_songs()
    if df.empty:
        _similarity_matrix = np.array([])
        _song_index = {}
        _song_ids = []
        return

    _song_ids = df["id"].tolist()
    _song_index = {sid: i for i, sid in enumerate(_song_ids)}

    features = _build_features(df)
    _similarity_matrix = cosine_similarity(features)


def get_similar_songs(song_id: str, n: int = 20) -> list[str]:
    """Return top-N similar song IDs (excluding the query song)."""
    if _similarity_matrix is None or len(_similarity_matrix) == 0:
        build_content_model()

    if song_id not in _song_index:
        # Rebuild and retry once
        build_content_model()
        if song_id not in _song_index:
            return []

    idx = _song_index[song_id]
    scores = list(enumerate(_similarity_matrix[idx]))
    scores.sort(key=lambda x: x[1], reverse=True)
    # Skip self (score == 1.0 at position idx)
    result = [_song_ids[i] for i, _ in scores if _song_ids[i] != song_id]
    return result[:n]


def get_content_scores_for_user(user_genre_weights: dict, n: int = 50) -> list[tuple[str, float]]:
    """
    Score all songs based on user genre preferences.
    Returns list of (song_id, score) sorted descending.
    """
    if _similarity_matrix is None:
        build_content_model()

    rows = fetch_all("""
        SELECT s.id, s."genreId"
        FROM "Song" s
        WHERE s.status = 'published'
    """)

    results = []
    for row in rows:
        weight = user_genre_weights.get(row["genreId"], 0.0)
        results.append((row["id"], float(weight)))

    results.sort(key=lambda x: x[1], reverse=True)
    return results[:n]
