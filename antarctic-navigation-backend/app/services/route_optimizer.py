"""
Route optimization - Module C.

Builds a cost-grid combining ice concentration (Module A) and iceberg
proximity/uncertainty (Module B), then runs a grid-based pathfinding
algorithm to compute both a naive shortest route and a risk-aware
recommended route.

BASELINE VERSION: uses a straightforward weighted-grid A* implementation.
Multi-objective refinement (penalizing turns, not just distance+risk) is
a documented Phase 2 upgrade, per the YOLOv5-ICE-inspired approach from
our research review.
"""

import os
import json
import numpy as np
import heapq
from shapely.geometry import shape, Point
from shapely.prepared import prep

# Lightweight land check using a bundled low-res coastline (Natural Earth 110m)
# instead of global_land_mask's full-resolution global grid (was the main
# memory hog causing OOM on Render's 512MB free tier).
_land_geom = None

_GEOJSON_PATH = os.path.join(
    os.path.dirname(__file__), "..", "data", "ne_110m_land.geojson"
)


def get_land_geom():
    """Load and cache the land polygon once (lazy, on first use)."""
    global _land_geom
    if _land_geom is None:
        with open(_GEOJSON_PATH, "r") as f:
            geojson = json.load(f)
        # Merge all land features into a single prepared geometry for fast
        # repeated point-in-polygon checks.
        polygons = [shape(feature["geometry"]) for feature in geojson["features"]]
        from shapely.ops import unary_union
        merged = unary_union(polygons)
        _land_geom = prep(merged)
    return _land_geom


def is_land(lat, lon):
    land = get_land_geom()
    return land.contains(Point(lon, lat))  # shapely uses (x=lon, y=lat)


def haversine_km(lat1, lon1, lat2, lon2):
    R = 6371.0
    lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
    return 2 * R * np.arcsin(np.sqrt(a))


def build_grid(start, end, resolution=30):
    """Build a simple lat/lon grid spanning start->end with padding."""
    lat_min = min(start["lat"], end["lat"]) - 2.0
    lat_max = max(start["lat"], end["lat"]) + 2.0
    lon_min = min(start["lon"], end["lon"]) - 5.0
    lon_max = max(start["lon"], end["lon"]) + 5.0

    lats = np.linspace(lat_min, lat_max, resolution)
    lons = np.linspace(lon_min, lon_max, resolution)
    return lats, lons


def ice_risk_at(lat, lon, ice_grid_data):
    """Interpolate ice concentration at an arbitrary point from the forecast grid (day 0)."""
    grid = ice_grid_data["daily_forecasts"][0]["grid"]
    grid_lats = np.array(grid["lats"])
    grid_lons = np.array(grid["lons"])
    concentration = np.array(grid["concentration_pct"])

    lat_idx = np.argmin(np.abs(grid_lats - lat))
    lon_idx = np.argmin(np.abs(grid_lons - lon))
    return concentration[lat_idx, lon_idx]


def iceberg_risk_at(lat, lon, iceberg_predicted_path):
    """Higher risk the closer a grid point is to a predicted iceberg position."""
    min_dist = float("inf")
    for p in iceberg_predicted_path:
        d = haversine_km(lat, lon, p["lat"], p["lon"])
        min_dist = min(min_dist, d - p.get("uncertainty_radius_km", 0))
    if min_dist < 0:
        return 100
    return max(0, 100 - min_dist)


def cell_cost(lat, lon, ice_grid_data, iceberg_predicted_path):
    if is_land(lat, lon):
        return 100000  # effectively impassable - never route through land

    ice_cost = ice_risk_at(lat, lon, ice_grid_data)
    berg_cost = iceberg_risk_at(lat, lon, iceberg_predicted_path)
    return max(ice_cost, berg_cost)


def astar_route(start, end, ice_grid_data, iceberg_predicted_path, risk_weight=3.0):
    """
    Simple grid-based A* that penalizes both distance and risk.
    risk_weight controls how strongly ice/iceberg risk is avoided
    (higher = prioritizes safety over shortest path).
    """
    lats, lons = build_grid(start, end)

    def node_id(i, j):
        return i * len(lons) + j

    def nearest_node(lat, lon):
        i = np.argmin(np.abs(lats - lat))
        j = np.argmin(np.abs(lons - lon))
        return i, j

    start_i, start_j = nearest_node(start["lat"], start["lon"])
    end_i, end_j = nearest_node(end["lat"], end["lon"])

    open_set = [(0, start_i, start_j)]
    came_from = {}
    g_score = {(start_i, start_j): 0}

    while open_set:
        _, ci, cj = heapq.heappop(open_set)

        if (ci, cj) == (end_i, end_j):
            path = []
            node = (ci, cj)
            while node in came_from:
                path.append(node)
                node = came_from[node]
            path.append((start_i, start_j))
            path.reverse()
            return [{"lat": float(lats[i]), "lon": float(lons[j])} for i, j in path]

        for di in [-1, 0, 1]:
            for dj in [-1, 0, 1]:
                if di == 0 and dj == 0:
                    continue
                ni, nj = ci + di, cj + dj
                if 0 <= ni < len(lats) and 0 <= nj < len(lons):
                    dist_km = haversine_km(lats[ci], lons[cj], lats[ni], lons[nj])
                    risk = cell_cost(lats[ni], lons[nj], ice_grid_data, iceberg_predicted_path)
                    step_cost = dist_km + (risk_weight * risk)

                    tentative_g = g_score[(ci, cj)] + step_cost
                    if (ni, nj) not in g_score or tentative_g < g_score[(ni, nj)]:
                        g_score[(ni, nj)] = tentative_g
                        h = haversine_km(lats[ni], lons[nj], lats[end_i], lons[end_j])
                        heapq.heappush(open_set, (tentative_g + h, ni, nj))
                        came_from[(ni, nj)] = (ci, cj)

    return [start, end]  # fallback if no path found


def compute_route_stats(waypoints, vessel):
    total_distance = 0
    for i in range(len(waypoints) - 1):
        total_distance += haversine_km(
            waypoints[i]["lat"], waypoints[i]["lon"],
            waypoints[i+1]["lat"], waypoints[i+1]["lon"]
        )
    distance_nm = total_distance * 0.539957  # km to nautical miles
    fuel_tons = distance_nm * vessel.get("fuel_rate_ton_per_nm", 0.02)
    time_hours = distance_nm / vessel.get("speed_knots", 12)
    return distance_nm, fuel_tons, time_hours