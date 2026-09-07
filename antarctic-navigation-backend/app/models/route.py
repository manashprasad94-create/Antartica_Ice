from pydantic import BaseModel
from typing import List, Optional


class Location(BaseModel):
    name: Optional[str] = None
    lat: float
    lon: float


class Vessel(BaseModel):
    ice_class: Optional[str] = "PC5"
    speed_knots: float = 12.0
    fuel_rate_ton_per_nm: float = 0.02


class RouteRequest(BaseModel):
    start: Location
    end: Location
    vessel: Vessel = Vessel()


class RiskZone(BaseModel):
    lat: float
    lon: float
    reason: str
    severity: str


class RouteDetail(BaseModel):
    waypoints: List[Location]
    distance_nm: float
    estimated_fuel_tons: float
    estimated_time_hours: float
    ice_risk_pct: float
    risk_zones: List[RiskZone] = []


class Comparison(BaseModel):
    extra_distance_pct: float
    extra_fuel_pct: float
    risk_reduction_pct: float


class RouteResponse(BaseModel):
    shortest_route: RouteDetail
    recommended_route: RouteDetail
    comparison: Comparison