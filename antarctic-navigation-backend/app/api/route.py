"""
API endpoint for route planning - Module C.

Combines Module A (ice forecast) and Module B (iceberg trajectory)
outputs into a risk-weighted cost-grid, then computes both a naive
shortest route and a risk-aware recommended route using A* pathfinding.
"""

import numpy as np
from fastapi import APIRouter
from app.models.route import RouteRequest, RouteResponse, RouteDetail, Comparison, Location, RiskZone
from app.services.route_optimizer import astar_route, compute_route_stats, ice_risk_at
from app.services.ice_forecast import forecast_ice_concentration
from app.api.icebergs import load_iceberg_data
from app.services.iceberg_physics import predict_drift_step
from app.ml.drift_correction import correct_prediction
from fastapi import HTTPException

router = APIRouter()


def get_predicted_iceberg_positions():
    """
    Gather predicted positions for all tracked icebergs, for route risk
    assessment. Uses the same 5-day wind averaging as the trajectory
    endpoint to smooth out single-day wind anomalies.
    """
    data = load_iceberg_data("a23a")
    if data is None:
        return []

    history = data["historical_path"]
    conditions = data["environmental_conditions"]
    area_km2 = data["area_km2"]
    last_point = history[-1]

    recent_conditions = conditions[-5:] if len(conditions) >= 5 else conditions
    avg_wind_u = sum(c["wind_u"] for c in recent_conditions) / len(recent_conditions)
    avg_wind_v = sum(c["wind_v"] for c in recent_conditions) / len(recent_conditions)

    lat, lon = last_point["lat"], last_point["lon"]
    predicted = []
    for day in range(1, 6):
        for _ in range(24):
            lat, lon, _, _ = predict_drift_step(
                latitude_deg=lat, longitude_deg=lon,
                wind_u=avg_wind_u, wind_v=avg_wind_v,
                current_u=0.15, current_v=0.05,
                area_km2=area_km2, dt_seconds=3600.0,
            )
        corrected_lat, corrected_lon, _, _ = correct_prediction(
            lat, lon, avg_wind_u, avg_wind_v, 0.15, 0.05
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
    from app.services.route_optimizer import haversine_km

    # Sanity check: if start/end are extremely far apart in longitude,
    # our current grid-based router can't handle true circumnavigation
    # routing around the continent - flag this clearly instead of
    # silently returning a route that cuts through land.
    lon_diff = abs(request.start.lon - request.end.lon)
    if lon_diff > 70 and lon_diff < 300:  # not near the antimeridian wraparound case
        raise HTTPException(status_code=400, detail={
            "error": True,
            "message": "Selected points are too far apart for direct routing in this prototype (would require circumnavigating the continent). Please select points along a similar coastal region, e.g. near Bharati-Maitri corridor.",
            "code": "ROUTE_TOO_FAR"
        })

    # Shortest route: same A* but with risk_weight near zero (ignores ice/iceberg risk,
    # still avoids land since land cost is effectively infinite regardless of risk_weight)
    shortest_waypoints = astar_route(start, end, ice_data, iceberg_positions, risk_weight=0.01)
    # Recommended route: full risk-aware weighting
    recommended_waypoints = astar_route(start, end, ice_data, iceberg_positions, risk_weight=6.0)

    shortest_dist, shortest_fuel, shortest_time = compute_route_stats(shortest_waypoints, vessel)
    rec_dist, rec_fuel, rec_time = compute_route_stats(recommended_waypoints, vessel)

    def avg_risk(waypoints):
        risks = [ice_risk_at(w["lat"], w["lon"], ice_data) for w in waypoints]
        return float(np.mean(risks)) if risks else 0.0

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
        iceberg_positions=iceberg_positions,
    )