import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import joblib
import random

MODEL_PATH = os.path.join(os.path.dirname(__file__), "models", "demand_model.pkl")
ENCODERS_PATH = os.path.join(os.path.dirname(__file__), "models", "demand_encoders.pkl")
DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "booking_history.csv")

# Ensure directories exist
os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
os.makedirs(os.path.dirname(DATA_PATH), exist_ok=True)

CATEGORIES = ['plumber', 'electrician', 'carpenter', 'tutor', 'cleaner', 'painter', 'mechanic', 'doctor', 'roof repair', 'ac repair', 'other']
WEATHER_CONDS = ['clear', 'cloudy', 'fog', 'rain', 'snow', 'rain showers', 'thunderstorm']
TIMES = ['morning', 'afternoon', 'evening', 'night']
DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

def generate_mock_data(samples=2000):
    """Generates synthetic booking history mapping weather contexts to demand scores"""
    print("Generating synthetic historical weather dataset...")
    
    data = []
    
    for _ in range(samples):
        service = random.choice(CATEGORIES)
        weather = random.choice(WEATHER_CONDS)
        time = random.choice(TIMES)
        day = random.choice(DAYS)
        temp = round(random.uniform(-5, 45), 1) # Celsius
        
        # Calculate a baseline demand
        base_demand = random.uniform(0.1, 0.4)
        
        # Apply synthetic mapping logic
        if temp > 30 and service in ['ac repair', 'electrician']:
            base_demand += 0.4
        if weather in ['Rain', 'Rain Showers', 'Thunderstorm'] and service in ['plumber', 'roof repair', 'electrician']:
            base_demand += 0.4
        if weather in ['Snow'] and service in ['mechanic']:
            base_demand += 0.3
        if time in ['night', 'evening'] and service in ['tutor', 'cleaner']:
            base_demand -= 0.2
        if day in ['saturday', 'sunday'] and service in ['cleaner', 'painter', 'carpenter']:
            base_demand += 0.3
            
        # Normalize between 0.0 and 1.0 (with slight gaussian noise)
        demand_score = min(1.0, max(0.0, base_demand + random.gauss(0, 0.05)))
        
        data.append([service, temp, weather, time, day, round(demand_score, 3)])
        
    df = pd.DataFrame(data, columns=['service', 'temperature', 'weather', 'time', 'day', 'demand_score'])
    df.to_csv(DATA_PATH, index=False)
    return df

def train_model():
    if not os.path.exists(DATA_PATH):
        df = generate_mock_data()
    else:
        df = pd.read_csv(DATA_PATH)
        
    print("Training Demand Prediction (Random Forest)...")
    
    encoders = {
        'service': LabelEncoder(),
        'weather': LabelEncoder(),
        'time': LabelEncoder(),
        'day': LabelEncoder()
    }
    
    # Encode categorical features
    encoded_df = df.copy()
    for col in encoders.keys():
        # Fit on all possible values plus 'unknown' handles
        all_possible = []
        if col == 'service': all_possible = CATEGORIES + ['unknown']
        elif col == 'weather': all_possible = WEATHER_CONDS + ['unknown']
        elif col == 'time': all_possible = TIMES + ['unknown']
        elif col == 'day': all_possible = DAYS + ['unknown']
        
        encoders[col].fit(all_possible)
        
        # Map existing
        encoded_df[col] = df[col].apply(lambda x: x if x in all_possible else 'unknown')
        encoded_df[col] = encoders[col].transform(encoded_df[col])
        
    X = encoded_df[['service', 'temperature', 'weather', 'time', 'day']]
    y = encoded_df['demand_score']
    
    model = RandomForestRegressor(n_estimators=50, max_depth=8, random_state=42)
    model.fit(X, y)
    
    joblib.dump(model, MODEL_PATH)
    joblib.dump(encoders, ENCODERS_PATH)
    print("✅ Demand prediction model trained successfully")
    return model, encoders

def load_demand_model():
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        return joblib.load(MODEL_PATH), joblib.load(ENCODERS_PATH)
    return train_model()

_demand_model = None
_demand_encoders = None

def get_demand_model():
    global _demand_model, _demand_encoders
    if _demand_model is None or _demand_encoders is None:
        _demand_model, _demand_encoders = load_demand_model()
    return _demand_model, _demand_encoders

def predict_demand_score(service: str, temp: float, weather: str, time: str, day: str) -> float:
    model, encoders = get_demand_model()
    
    features = []
    
    # Safely transform (normalize to lowercase to match encoders)
    service_val = service.lower() if service.lower() in encoders['service'].classes_ else 'unknown'
    weather_val = weather.lower() if weather.lower() in encoders['weather'].classes_ else 'unknown'
    time_val = time.lower() if time.lower() in encoders['time'].classes_ else 'unknown'
    day_val = day.lower() if day.lower() in encoders['day'].classes_ else 'unknown'
    
    features.append(encoders['service'].transform([service_val])[0])
    features.append(float(temp))
    features.append(encoders['weather'].transform([weather_val])[0])
    features.append(encoders['time'].transform([time_val])[0])
    features.append(encoders['day'].transform([day_val])[0])
    
    prediction = model.predict([features])[0]
    return float(round(prediction, 3))
