"""
Physics-based iceberg drift model — empirical "wind factor" method.

This uses the well-established simplified drift model used in real
oceanographic search-and-rescue and iceberg forecasting:

    drift_velocity = ocean_current_velocity + windage_factor * wind_velocity

with a Coriolis-driven deflection angle applied to the wind-driven
component (Southern Hemisphere: deflection to the LEFT of the wind
direction, typically 20-40 degrees, commonly ~25-30 degrees).

This is preferred over full force/mass numerical integration for this
project because: (1) it's a real, citable, validated approach already
used in operational drift forecasting, not a from-scratch derivation,
and (2) full force-integration requires careful handling of relative
velocity/drag terms to reach a stable terminal velocity, which is easy
to get subtly wrong (as our first version did — see fixed bug notes).
"""

import numpy as np

def get_windage_factor(area_km2: float) -> float:
    """
    Larger icebergs have more mass/keel-drag relative to wind exposure,
    so effective windage decreases with size. Small bergs ~0.02-0.03,
    huge tabular bergs (like A23A) ~0.005-0.01.
    """
    if area_km2 > 3000:
        return 0.006
    elif area_km2 > 500:
        return 0.012
    else:
        return 0.02          # iceberg drifts at ~2% of wind speed (empirical, commonly cited 1.8-3%)
CORIOLIS_DEFLECTION_DEG = 25.0  # Southern Hemisphere: deflect wind-driven component to the LEFT


def rotate_vector(u: float, v: float, angle_deg: float):
    """Rotate a 2D vector (u, v) by angle_deg degrees (positive = counterclockwise)."""
    angle_rad = np.radians(angle_deg)
    cos_a, sin_a = np.cos(angle_rad), np.sin(angle_rad)
    new_u = u * cos_a - v * sin_a
    new_v = u * sin_a + v * cos_a
    return new_u, new_v


def predict_drift_step(
    latitude_deg: float,
    longitude_deg: float,
    wind_u: float, wind_v: float,
    current_u: float, current_v: float,
    area_km2: float = None,   # kept for API compatibility, not used in this simplified model
    mass_kg: float = None,    # kept for API compatibility, not used in this simplified model
    dt_seconds: float = 3600.0,
):
    """
    Predict the iceberg's new position after one timestep using the
    empirical windage-factor drift model with Coriolis deflection.

    Returns: (new_lat, new_lon, velocity_u, velocity_v) in m/s
    """
    # Southern Hemisphere: deflect the wind-driven component to the LEFT
    # (negative angle = clockwise rotation = left deflection when looking
    # in the direction of motion in the Southern Hemisphere)
    deflected_wind_u, deflected_wind_v = rotate_vector(
        wind_u, wind_v, angle_deg=-CORIOLIS_DEFLECTION_DEG
    )

    windage = get_windage_factor(area_km2 if area_km2 else 1000)
    vel_u = current_u + windage * deflected_wind_u
    vel_v = current_v + windage * deflected_wind_v

    meters_per_deg_lat = 111320.0
    meters_per_deg_lon = 111320.0 * np.cos(np.radians(latitude_deg))

    delta_lat = (vel_v * dt_seconds) / meters_per_deg_lat
    delta_lon = (vel_u * dt_seconds) / meters_per_deg_lon

    new_lat = latitude_deg + delta_lat
    new_lon = longitude_deg + delta_lon

    return new_lat, new_lon, vel_u, vel_v