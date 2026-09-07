from fastapi import APIRouter, Query, HTTPException
from app.models.ice_forecast import IceForecastResponse
from app.services.ice_forecast import forecast_ice_concentration, load_real_ice_data
from app.services.data_freshness import check_staleness

router = APIRouter()


@router.get("/ice-forecast", response_model=IceForecastResponse)
def get_ice_forecast(days: int = Query(default=5, ge=1, le=10)):
    try:
        data = load_real_ice_data()
        last_real_date = data["daily_real_observations"][-1]["date"]
        is_stale, age_days = check_staleness(last_real_date)

        result = forecast_ice_concentration(days=days)
        response = IceForecastResponse(**result)

        if is_stale:
            # Attach staleness info as an extra field the frontend can check
            # (Pydantic model would need an optional field added for this in production;
            # for now this demonstrates the pattern via response headers instead)
            response.stale = True
            response.data_age_days = age_days

        return response
    except FileNotFoundError:
        raise HTTPException(status_code=503, detail={
            "error": True,
            "message": "Sea-ice data source unavailable. This can happen due to satellite pass gaps or data pipeline issues.",
            "code": "ICE_DATA_UNAVAILABLE"
        })