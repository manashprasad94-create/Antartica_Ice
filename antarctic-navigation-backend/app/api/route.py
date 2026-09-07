from fastapi import APIRouter
from app.models.route import RouteRequest, RouteResponse, RouteDetail, Comparison, Location, RiskZone
from app.services.route_optimizer import astar_route, compute_route_stats, ice_risk_at
from app.services.ice_forecast import forecast_ice_concentration
from app.api.icebergs import load_iceberg_data
from app.services.iceberg_physics import predict_drift_step
from app.ml.drift_correction import correct_prediction

router = APIRouter()


def get_predicted_iceberg_positions():
    """Gather predicted positions for all tracked icebergs, for route risk assessment."""
    data = load_iceberg_data("a23a")
    if data is None:
        return []

    history = data["historical_path"]
    conditions = data["environmental_conditions"]
    area_km2 = data["area_km2"]
    last_point = history[-1]
    last_cond = conditions[-1]

    lat, lon = last_point["lat"], last_point["lon"]
    predicted = []
    for day in range(1, 6):
        for _ in range(24):
            lat, lon, _, _ = predict_drift_step(
                latitude_deg=lat, longitude_deg=lon,
                wind_u=last_cond["wind_u"], wind_v=last_cond["wind_v"],
                current_u=0.15, current_v=0.05,
                area_km2=area_km2, dt_seconds=3600.0,
            )
        corrected_lat, corrected_lon, _, _ = correct_prediction(
            lat, lon, last_cond["wind_u"], last_cond["wind_v"], 0.15, 0.05
        )
        predicted.append({
            "lat": corrected_lat, "lon": corrected_lon,
            "uncertainty_radius_km": 5.0 + (day * 4.0)
        })
    return predicted


@router.post("/route", response_model=RouteResponse)
def plan_route(request: RouteRequest):
    ice_data = forecast_ice_concentration(days=5)
    iceberg_positions = get_predicted_iceberg_positions()

    start = {"lat": request.start.lat, "lon": request.start.lon}
    end = {"lat": request.end.lat, "lon": request.end.lon}
    vessel = request.vessel.dict()

    # Shortest route: same A* but with risk_weight near zero (ignores risk)
    shortest_waypoints = astar_route(start, end, ice_data, iceberg_positions, risk_weight=0.01)
    # Recommended route: full risk-aware weighting
    recommended_waypoints = astar_route(start, end, ice_data, iceberg_positions, risk_weight=3.0)

    shortest_dist, shortest_fuel, shortest_time = compute_route_stats(shortest_waypoints, vessel)
    rec_dist, rec_fuel, rec_time = compute_route_stats(recommended_waypoints, vessel)

    def avg_risk(waypoints):
        risks = [ice_risk_at(w["lat"], w["lon"], ice_data) for w in waypoints]
        return float(np.mean(risks)) if risks else 0.0

    import numpy as np
    shortest_risk = avg_risk(shortest_waypoints)
    rec_risk = avg_risk(recommended_waypoints)

    # Build risk zone explanations for the shortest (risky) route
    risk_zones = []
    for w in shortest_waypoints:
        risk = ice_risk_at(w["lat"], w["lon"], ice_data)
        if risk > 50:
            risk_zones.append(RiskZone(
                lat=w["lat"], lon=w["lon"],
                reason=f"Forecasted {risk:.0f}% ice concentration in this area",
                severity="high" if risk > 70 else "medium"
            ))

    comparison = Comparison(
        extra_distance_pct=round(((rec_dist - shortest_dist) / shortest_dist) * 100, 1) if shortest_dist > 0 else 0,
        extra_fuel_pct=round(((rec_fuel - shortest_fuel) / shortest_fuel) * 100, 1) if shortest_fuel > 0 else 0,
        risk_reduction_pct=round(shortest_risk - rec_risk, 1),
    )

    return RouteResponse(
        shortest_route=RouteDetail(
            waypoints=[Location(**w) for w in shortest_waypoints],
            distance_nm=round(shortest_dist, 1),
            estimated_fuel_tons=round(shortest_fuel, 1),
            estimated_time_hours=round(shortest_time, 1),
            ice_risk_pct=round(shortest_risk, 1),
            risk_zones=risk_zones,
        ),
        recommended_route=RouteDetail(
            waypoints=[Location(**w) for w in recommended_waypoints],
            distance_nm=round(rec_dist, 1),
            estimated_fuel_tons=round(rec_fuel, 1),
            estimated_time_hours=round(rec_time, 1),
            ice_risk_pct=round(rec_risk, 1),
            risk_zones=[],
        ),
        comparison=comparison,
    )