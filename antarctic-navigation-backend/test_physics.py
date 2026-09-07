"""
Basic correctness tests for the iceberg physics drift model.
"""

import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.services.iceberg_physics import predict_drift_step, get_windage_factor, rotate_vector


def test_windage_factor_decreases_with_size():
    """Larger icebergs should have lower windage factor than smaller ones."""
    small = get_windage_factor(area_km2=100)
    large = get_windage_factor(area_km2=5000)
    assert large < small, "Larger icebergs should drift relatively slower under wind"


def test_drift_moves_in_reasonable_range():
    """A single hourly drift step should move the iceberg a small,
    physically plausible distance - not teleport, not stay frozen."""
    lat, lon, vel_u, vel_v = predict_drift_step(
        latitude_deg=-66.5, longitude_deg=-55.8,
        wind_u=8.0, wind_v=-3.0,
        current_u=0.15, current_v=0.05,
        area_km2=3800,
        dt_seconds=3600.0,
    )
    assert abs(lat - (-66.5)) < 0.1, "Single hour drift should be a small lat change"
    assert abs(lon - (-55.8)) < 0.1, "Single hour drift should be a small lon change"
    assert (lat, lon) != (-66.5, -55.8), "Position should change at all"


def test_rotate_vector_preserves_magnitude():
    """Rotating a vector should not change its magnitude, only direction."""
    import numpy as np
    u, v = 5.0, 3.0
    original_mag = np.sqrt(u**2 + v**2)
    new_u, new_v = rotate_vector(u, v, angle_deg=-25.0)
    new_mag = np.sqrt(new_u**2 + new_v**2)
    assert abs(original_mag - new_mag) < 1e-6, "Rotation should preserve vector magnitude"


def test_rotate_vector_zero_angle_unchanged():
    """Rotating by 0 degrees should return the same vector."""
    u, v = 5.0, 3.0
    new_u, new_v = rotate_vector(u, v, angle_deg=0.0)
    assert abs(new_u - u) < 1e-6 and abs(new_v - v) < 1e-6


if __name__ == "__main__":
    test_windage_factor_decreases_with_size()
    test_drift_moves_in_reasonable_range()
    test_rotate_vector_preserves_magnitude()
    test_rotate_vector_zero_angle_unchanged()
    print("All physics tests passed.")