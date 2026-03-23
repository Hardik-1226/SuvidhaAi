"""
Provider Recommendation Engine
Uses a weighted scoring formula to rank providers by relevance:
  score = (rating * 0.4) + (proximity * 0.4) + (availability * 0.2)

The proximity score is normalized: closer = higher score
"""

import math
from typing import List, Dict, Any


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate straight-line distance between two (lat, lon) points in km
    using the Haversine formula.
    """
    R = 6371  # Earth radius in km
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    d_phi = math.radians(lat2 - lat1)
    d_lambda = math.radians(lon2 - lon1)

    a = math.sin(d_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(d_lambda / 2) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def compute_score(provider: Dict[str, Any], user_lat: float, user_lon: float) -> float:
    """
    Compute AI recommendation score for a given provider.

    Weights:
        - rating      : 40% (normalized 0-1 from 5-star scale)
        - proximity   : 40% (1 / (1 + distance_km) so 0km = 1.0)
        - availability: 20%

    Returns:
        float score in range [0, 1]
    """
    # Normalize rating (0-1)
    rating_score = float(provider.get("rating", 0)) / 5.0

    # Proximity score — higher when closer
    prov_lat = float(provider.get("lat", 0))
    prov_lon = float(provider.get("lon", 0))
    distance_km = haversine_distance(user_lat, user_lon, prov_lat, prov_lon)
    proximity_score = 1.0 / (1.0 + distance_km)  # max 1 when distance = 0

    # Availability score (binary)
    availability_score = 1.0 if provider.get("isAvailable", True) else 0.0

    # Experience score (normalized roughly against 25 jobs)
    experience_score = min(float(provider.get("completedJobs", 0)) / 25.0, 1.0)

    # Weighted sum: 30% Rating, 30% Proximity, 20% Availability, 20% Experience
    score = (rating_score * 0.3) + (proximity_score * 0.3) + (availability_score * 0.2) + (experience_score * 0.2)
    return round(score, 4)


def recommend_providers(
    user_lat: float,
    user_lon: float,
    providers: List[Dict[str, Any]],
    top_n: int = 5,
) -> List[Dict[str, Any]]:
    """
    Score and rank all providers, return top N with scores.

    Args:
        user_lat: User's latitude
        user_lon: User's longitude
        providers: List of provider dicts with fields: id, lat, lon, rating, isAvailable
        top_n: Number of top recommendations to return

    Returns:
        List of dicts: { id, score }
    """
    if not providers:
        return []

    scored = []
    for prov in providers:
        score = compute_score(prov, user_lat, user_lon)
        scored.append({"id": prov["id"], "score": score})

    # Sort descending by score
    scored.sort(key=lambda x: x["score"], reverse=True)
    return scored[:top_n]
