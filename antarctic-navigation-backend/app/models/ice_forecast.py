from pydantic import BaseModel
from typing import List


class IceGrid(BaseModel):
    lats: List[float]
    lons: List[float]
    concentration_pct: List[List[float]]
    confidence_pct: List[List[float]]


class DailyForecast(BaseModel):
    day_offset: int
    grid: IceGrid


class Region(BaseModel):
    center_lat: float
    center_lon: float
    bbox: List[float]


class IceForecastResponse(BaseModel):
    region: Region
    forecast_days: int
    daily_forecasts: List[DailyForecast]
    stale: bool = False
    data_age_days: int = 0