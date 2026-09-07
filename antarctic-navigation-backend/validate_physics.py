import json
import numpy as np
from datetime import datetime
from app.services.iceberg_physics import predict_drift_step

with open("data/iceberg_a23a_fully_real.json") as f:
    data = json.load(f)

history = data["historical_path"]
conditions = data["environmental_conditions"]
area_km2 = data["area_km2"]

for c in conditions:
    c["current_u"] = 0.15
    c["current_v"] = 0.05

print(f"Validating drift model for {data['name']}\n")
print(f"{'Date':<12} {'Actual Next':<20} {'Predicted Next':<20} {'Error (km)':<10}")
print("-" * 65)

total_error_km = 0
count = 0

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

    meters_per_deg_lat = 111320.0
    meters_per_deg_lon = 111320.0 * np.cos(np.radians(start["lat"]))
    error_lat_km = (predicted_lat - actual_next["lat"]) * meters_per_deg_lat / 1000
    error_lon_km = (predicted_lon - actual_next["lon"]) * meters_per_deg_lon / 1000
    error_km = np.sqrt(error_lat_km**2 + error_lon_km**2)

    total_error_km += error_km
    count += 1

    print(f"{start['date']:<12} ({actual_next['lat']:.3f},{actual_next['lon']:.3f})   "
          f"({predicted_lat:.3f},{predicted_lon:.3f})   {error_km:.2f}")

print("-" * 65)
print(f"Average error: {total_error_km/count:.2f} km per prediction step")