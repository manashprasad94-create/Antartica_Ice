import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.services.route_optimizer import haversine_km, cell_cost


def test_haversine_zero_distance_same_point():
    d = haversine_km(-69.4, 76.2, -69.4, 76.2)
    assert d < 0.001, "Distance between identical points should be ~0"


def test_haversine_known_distance():
    """Roughly check a known distance: 1 degree of latitude is ~111km."""
    d = haversine_km(-69.0, 76.2, -70.0, 76.2)
    assert 105 < d < 115, f"Expected ~111km for 1 degree latitude, got {d}"


def test_cell_cost_higher_near_iceberg():
    fake_ice_data = {
        "daily_forecasts": [{
            "grid": {
                "lats": [-69.0], "lons": [76.2],
                "concentration_pct": [[0]],
            }
        }]
    }
    iceberg_path = [{"lat": -69.0, "lon": 76.2, "uncertainty_radius_km": 10}]

    cost_at_iceberg = cell_cost(-69.0, 76.2, fake_ice_data, iceberg_path)
    cost_far_away = cell_cost(-50.0, 20.0, fake_ice_data, iceberg_path)

    assert cost_at_iceberg > cost_far_away, "Cost should be higher near a predicted iceberg position"


if __name__ == "__main__":
    test_haversine_zero_distance_same_point()
    test_haversine_known_distance()
    test_cell_cost_higher_near_iceberg()
    print("All route optimizer tests passed.")