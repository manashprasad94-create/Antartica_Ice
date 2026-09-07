from pydantic import BaseModel
from typing import List, Optional


class IcebergSummary(BaseModel):
    id: str
    name: str
    current_lat: float
    current_lon: float
    area_km2: float


class IcebergListResponse(BaseModel):
    icebergs: List[IcebergSummary]


class HistoricalPoint(BaseModel):
    date: str
    lat: float
    lon: float


class PredictedPoint(BaseModel):
    date: str
    lat: float
    lon: float
    uncertainty_radius_km: float


class IcebergTrajectoryResponse(BaseModel):
    iceberg_id: str
    historical_path: List[HistoricalPoint]
    predicted_path: List[PredictedPoint]
    physics_baseline_contribution_pct: float
    ml_correction_contribution_pct: float


class ErrorResponse(BaseModel):
    error: bool = True
    message: str
    code: str