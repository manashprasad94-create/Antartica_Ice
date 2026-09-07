"""
Same validation as validate_physics.py, but now applies the trained
ML residual correction on top of the physics prediction, and compares
BOTH errors side by side: physics-only vs physics+ML.

This produces the exact before/after numbers for the pitch.
"""

import json
import numpy as np
from datetime import datetime
from app.services.iceberg_physics import predict_drift_step
from app.ml.drift_correction import correct_prediction

with open("data/iceberg_a23a_fully_real.json") as f:
    data = json.load(f)

history = data["historical_path"]
conditions = data["environmental_conditions"]
for c in conditions:
    c["current_u"] = 0.15  # placeholder - real ERA5/Copernicus Marine current not yet sourced
    c["current_v"] = 0.05
area_km2 = data["area_km2"]

print(f"Validating physics-only vs physics+ML for {data['name']}\n")
print(f"{'Date':<12} {'Physics Error (km)':<20} {'Physics+ML Error (km)':<22}")
print("-" * 60)

total_physics_error = 0
total_ml_error = 0
count = 0

for i in range(len(conditions) -1 ):
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

    physics_lat, physics_lon = lat, lon

    corrected_lat, corrected_lon, _, _ = correct_prediction(
        physics_lat, physics_lon,
        cond["wind_u"], cond["wind_v"], cond["current_u"], cond["current_v"]
    )

    meters_per_deg_lat = 111320.0
    meters_per_deg_lon = 111320.0 * np.cos(np.radians(start["lat"]))

    def error_km(pred_lat, pred_lon):
        elat = (pred_lat - actual_next["lat"]) * meters_per_deg_lat / 1000
        elon = (pred_lon - actual_next["lon"]) * meters_per_deg_lon / 1000
        return np.sqrt(elat**2 + elon**2)

    phys_err = error_km(physics_lat, physics_lon)
    ml_err = error_km(corrected_lat, corrected_lon)

    total_physics_error += phys_err
    total_ml_error += ml_err
    count += 1

    print(f"{start['date']:<12} {phys_err:<20.2f} {ml_err:<22.2f}")

print("-" * 60)
print(f"Average physics-only error: {total_physics_error/count:.2f} km")
print(f"Average physics+ML error:   {total_ml_error/count:.2f} km")
improvement = (1 - (total_ml_error/count) / (total_physics_error/count)) * 100
print(f"Improvement: {improvement:.1f}%")