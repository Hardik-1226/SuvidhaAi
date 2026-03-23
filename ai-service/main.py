"""
FastAPI AI Microservice for SuvidhaAI
Exposes two ML endpoints:
  POST /recommend    → Returns top-5 provider recommendations (weighted scoring)
  POST /review-check → Detects if a review is genuine or suspicious (NLP + ML)
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import uvicorn

from recommender import recommend_providers
from fake_review_detector import check_review, train_model
from demand_predictor import predict_demand_score, train_model as train_demand_model

import os

# ---- App Initialization ----
app = FastAPI(
    title="SuvidhaAI AI Service",
    description="AI microservice for recommendations and fake review detection",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to backend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pre-train the model on startup if not already saved
MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "review_classifier.pkl")
if not os.path.exists(MODEL_PATH):
    print("🤖 Training fake review model on startup...")
    train_model()
    print("✅ Model ready")

DEMAND_MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "demand_model.pkl")
if not os.path.exists(DEMAND_MODEL_PATH):
    print("🤖 Training demand prediction model on startup...")
    train_demand_model()
    print("✅ Demand Model ready")


# ---- Request/Response Schemas ----

class ProviderInput(BaseModel):
    id: str
    lat: float
    lon: float
    rating: float = 0.0
    isAvailable: bool = True
    completedJobs: int = 0


class RecommendRequest(BaseModel):
    user_lat: float
    user_lon: float
    category: Optional[str] = "any"
    providers: List[ProviderInput]


class RecommendResponse(BaseModel):
    recommendations: List[dict]


class ReviewCheckRequest(BaseModel):
    review: str


class ReviewCheckResponse(BaseModel):
    label: str       # "genuine" | "suspicious"
    confidence: float


class PredictDemandRequest(BaseModel):
    service: str
    temperature: float
    weather: str
    time: str
    day: str

class PredictDemandResponse(BaseModel):
    demand_score: float

class WeatherRecRequest(BaseModel):
    temperature: float
    weather: str

class WeatherRecResponse(BaseModel):
    recommended_services: List[str]


# ---- Endpoints ----

@app.get("/")
def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "SuvidhaAI AI", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/recommend", response_model=RecommendResponse)
def get_recommendations(req: RecommendRequest):
    """
    Returns top-5 providers ranked by AI scoring formula:
    score = (rating × 0.4) + (proximity × 0.4) + (availability × 0.2)

    Example request:
    {
      "user_lat": 28.6139,
      "user_lon": 77.2090,
      "category": "plumber",
      "providers": [
        {"id": "abc123", "lat": 28.62, "lon": 77.21, "rating": 4.5, "isAvailable": true}
      ]
    }
    """
    providers_data = [p.model_dump() for p in req.providers]
    ranked = recommend_providers(req.user_lat, req.user_lon, providers_data, top_n=5)
    return RecommendResponse(recommendations=ranked)


@app.post("/review-check", response_model=ReviewCheckResponse)
def check_fake_review(req: ReviewCheckRequest):
    """
    Classifies a review as genuine or suspicious using NLP + Logistic Regression.

    Example request:
    {"review": "Great service, very professional!"}

    Example response:
    {"label": "genuine", "confidence": 0.92}
    """
    import traceback
    if not req.review or len(req.review.strip()) < 3:
        return ReviewCheckResponse(label="suspicious", confidence=0.95)

    try:
        result = check_review(req.review)
        return ReviewCheckResponse(**result)
    except Exception as e:
        error_msg = traceback.format_exc()
        # Return error as label for debugging
        return ReviewCheckResponse(label=f"error: {str(e)}", confidence=0.0)


@app.post("/predict-demand", response_model=PredictDemandResponse)
def predict_demand(req: PredictDemandRequest):
    """
    Predicts demand score (0-1) for a specific service based on weather/time context.
    Uses RandomForest ML model.
    """
    score = predict_demand_score(req.service, req.temperature, req.weather, req.time, req.day)
    return PredictDemandResponse(demand_score=score)

@app.post("/weather-recommendation", response_model=WeatherRecResponse)
def get_weather_recommendation(req: WeatherRecRequest):
    """
    Returns top 3 recommended categories based on AI demand prediction model.
    """
    import datetime
    
    # Context for ML model
    now = datetime.datetime.now()
    current_time = "morning"
    if 12 <= now.hour < 17: current_time = "afternoon"
    elif 17 <= now.hour < 21: current_time = "evening"
    elif now.hour >= 21 or now.hour < 6: current_time = "night"
    
    current_day = now.strftime("%A").lower()
    
    # Categories to evaluate
    eval_categories = ['ac repair', 'plumber', 'electrician', 'roof repair', 'mechanic', 'cleaner', 'painter', 'tutor', 'carpenter']
    
    scores = []
    for cat in eval_categories:
        try:
            score = predict_demand_score(cat, req.temperature, req.weather, current_time, current_day)
            scores.append({"category": cat, "score": score})
        except:
            continue
            
    # Sort by demand score descending
    scores.sort(key=lambda x: x["score"], reverse=True)
    
    # Return top 3
    res_list = [s["category"] for s in scores[:3]]
    
    # Fallback if model failed or returned empty
    if not res_list:
        res_list = ["electrician", "plumber", "cleaner"]
        
    return WeatherRecResponse(recommended_services=res_list)


# ---- Run ----
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
# Retrained Model Trigger 1
