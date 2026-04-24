import numpy as np
import pandas as pd
from sklearn.decomposition import TruncatedSVD
from app.database import fetch_all

_user_factors = None
_song_factors = None
_user_index = None   # user_id -> row
_song_index = None   # song_id -> col
_user_ids = None
_song_ids = None


def _load_interactions() -> pd.DataFrame:
    # Play history: score = completionRate * 2 (0..2)
    plays = fetch_all("""
        SELECT "userId", "songId", "completionRate"
        FROM "PlayHistory"
        WHERE "completionRate" IS NOT NULL
    """)
    play_df = pd.DataFrame(plays) if plays else pd.DataFrame(columns=["userId", "songId", "completionRate"])
    if not play_df.empty:
        play_df["score"] = play_df["completionRate"].astype(float) * 2.0
        play_df = play_df[["userId", "songId", "score"]]

    # Behaviors: like=+2, dislike=-2, skip=-1
    behaviors = fetch_all("""
        SELECT "userId", "songId", action
        FROM "UserBehavior"
    """)
    beh_df = pd.DataFrame(behaviors) if behaviors else pd.DataFrame(columns=["userId", "songId", "action"])
    action_map = {"like": 2.0, "dislike": -2.0, "skip": -1.0}
    if not beh_df.empty:
        beh_df["score"] = beh_df["action"].map(action_map).fillna(0.0)
        beh_df = beh_df[["userId", "songId", "score"]]

    combined = pd.concat([play_df, beh_df], ignore_index=True)
    if combined.empty:
        return combined

    # Aggregate by user-song pair
    combined = combined.groupby(["userId", "songId"], as_index=False)["score"].sum()
    return combined


def build_collaborative_model():
    global _user_factors, _song_factors, _user_index, _song_index, _user_ids, _song_ids

    interactions = _load_interactions()
    if interactions.empty:
        _user_factors = None
        return

    _user_ids = interactions["userId"].unique().tolist()
    _song_ids = interactions["songId"].unique().tolist()
    _user_index = {uid: i for i, uid in enumerate(_user_ids)}
    _song_index = {sid: i for i, sid in enumerate(_song_ids)}

    matrix = np.zeros((len(_user_ids), len(_song_ids)))
    for _, row in interactions.iterrows():
        ui = _user_index[row["userId"]]
        si = _song_index[row["songId"]]
        matrix[ui, si] = row["score"]

    n_components = min(50, min(matrix.shape) - 1)
    if n_components < 1:
        _user_factors = None
        return

    svd = TruncatedSVD(n_components=n_components, random_state=42)
    _user_factors = svd.fit_transform(matrix)
    _song_factors = svd.components_.T  # shape: (n_songs, n_components)


def get_collaborative_scores(user_id: str, n: int = 50) -> list[tuple[str, float]]:
    """Return top-N (song_id, score) for user based on SVD."""
    if _user_factors is None:
        build_collaborative_model()

    if _user_factors is None or user_id not in _user_index:
        return []

    ui = _user_index[user_id]
    user_vec = _user_factors[ui]  # shape: (n_components,)
    scores = _song_factors @ user_vec  # shape: (n_songs,)

    indexed = list(zip(_song_ids, scores.tolist()))
    indexed.sort(key=lambda x: x[1], reverse=True)
    return indexed[:n]


def get_user_play_count(user_id: str) -> int:
    rows = fetch_all("""
        SELECT COUNT(*) as cnt
        FROM "PlayHistory"
        WHERE "userId" = :user_id
    """, {"user_id": user_id})
    return int(rows[0]["cnt"]) if rows else 0


def get_listened_song_ids(user_id: str) -> set:
    rows = fetch_all("""
        SELECT DISTINCT "songId" FROM "PlayHistory" WHERE "userId" = :user_id
    """, {"user_id": user_id})
    return {r["songId"] for r in rows}
