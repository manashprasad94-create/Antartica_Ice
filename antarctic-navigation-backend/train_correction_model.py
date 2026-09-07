import json
import numpy as np
from datetime import datetime
from app.services.iceberg_physics import predict_drift_step
from app.ml.drift_correction import train_residual_model

with open("data/iceberg_a23a_fully_real.json") as f:
    data = json.load(f)

history = data["historical_path"]
conditions = data["environmental_conditions"]
area_km2 = data["area_km2"]

for c in conditions:
    c["current_u"] = 0.15
    c["current_v"] = 0.05

features = []
residuals_lat = []
residuals_lon = []

for i in range(len(conditions) - 1):
    start = history[i]
    actual_next = history[i + 1]
    cond = conditions[i]

    d1 = datetime.strptime(start["date"], "%Y-%m-%d")
    d2 = datetime.strptime(actual_next["date"], "%Y-%m-%d")
    hours_gap = (d2 - d1).total_seconds() / 3600.0

    lat, lon = start["lat"], start["lon"]
    for _ in range(int(hours_gap)):
        lat, lon, _, _ = predict_drift_step(
            latitude_deg=lat, longitude_deg=lon,
            wind_u=cond["wind_u"], wind_v=cond["wind_v"],
            current_u=cond["current_u"], current_v=cond["current_v"],
            area_km2=area_km2,
            dt_seconds=3600.0,
        )

    predicted_lat, predicted_lon = lat, lon
    residual_lat = actual_next["lat"] - predicted_lat
    residual_lon = actual_next["lon"] - predicted_lon

    features.append([cond["wind_u"], cond["wind_v"], cond["current_u"], cond["current_v"]])
    residuals_lat.append(residual_lat)
    residuals_lon.append(residual_lon)

print(f"Training on {len(features)} REAL samples...")
train_residual_model(residuals_lat, residuals_lon, features)
print("Model trained and saved to app/ml/residual_model.joblib")