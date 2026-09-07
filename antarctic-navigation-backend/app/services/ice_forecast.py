"""
Sea-ice concentration forecasting - Module A.

Uses REAL NOAA/NSIDC G02202 v6 observed concentration data for the
available historical window (April 2023) as the "current/near-term"
values, then applies a simple persistence+trend extrapolation for
days beyond the real data range. This is a deliberate two-part
honesty split: real observed values where we have them, clearly
labeled extrapolation beyond that (documented gap - a live pipeline
would pull fresh real data daily instead of extrapolating).
"""

import json
import os
import numpy as np

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")


def load_real_ice_data():
    filepath = os.path.join(DATA_DIR, "ice_concentration_real.json")
    with open(filepath) as f:
        return json.load(f)


def forecast_ice_concentration(days: int = 5):
    """
    Returns a list of daily forecasted concentration grids.
    Day 0 = most recent REAL observed data. Days 1+ = extrapolated
    using a simple persistence + small trend from the real observed
    trend in the preceding days (documented as a Phase 2 upgrade
    target for a full ConvLSTM model).
    """
    data = load_real_ice_data()
    real_days = data["daily_real_observations"]

    # Use the last available real day as "day 0"
    last_real = real_days[-1]
    grid = np.array(
        [[v if v is not None else np.nan for v in row] for row in last_real["concentration_pct"]],
        dtype=float
    )

    # Estimate a simple trend from the last few real days (day-over-day average change)
    if len(real_days) >= 3:
        prev_grid = np.array(
            [[v if v is not None else np.nan for v in row] for row in real_days[-3]["concentration_pct"]],
            dtype=float
        )
        daily_trend = (grid - prev_grid) / 2.0
        daily_trend = np.nan_to_num(daily_trend, nan=0.0)
    else:
        daily_trend = np.zeros_like(grid)

    daily_forecasts = []
    current_grid = grid.copy()

    for day in range(days):
        if day > 0:
            noise = np.random.normal(0, 1.0, size=current_grid.shape)
            current_grid = current_grid + daily_trend + noise
            current_grid = np.clip(current_grid, 0, 100)

        # Confidence: high for real observed day 0, decreasing for extrapolated days,
        # and lower wherever the underlying real data had a gap (nan)
        base_confidence = 95 if day == 0 else max(90 - (day * 8), 40)
        confidence_grid = np.full_like(current_grid, base_confidence, dtype=float)
        confidence_grid[np.isnan(grid)] -= 25  # lower confidence where real data had gaps

        # Fill any remaining NaN display values with a documented placeholder
        # (frontend should treat these as "no data" - we pass -1 as a sentinel)
        display_grid = np.where(np.isnan(current_grid), -1, current_grid)

        daily_forecasts.append({
            "day_offset": day,
            "grid": {
                "lats": data["lats"],
                "lons": data["lons"],
                "concentration_pct": np.round(display_grid, 1).tolist(),
                "confidence_pct": np.round(np.clip(confidence_grid, 0, 98), 1).tolist(),
            }
        })

    return {
        "region": data["region"],
        "forecast_days": days,
        "daily_forecasts": daily_forecasts,
    }