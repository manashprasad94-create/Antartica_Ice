"""
Generates a downloadable PDF report summarizing the most recent route
computation, ice forecast, and iceberg trajectory - the artifact a
real ship captain or mission planner could actually use.
"""

from fastapi import APIRouter
from fastapi.responses import Response
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import cm
from reportlab.pdfgen import canvas
from datetime import datetime
import io

from app.services.route_optimizer import astar_route, compute_route_stats, ice_risk_at
from app.services.ice_forecast import forecast_ice_concentration
from app.api.route import get_predicted_iceberg_positions
from app.models.route import RouteRequest

router = APIRouter()


@router.post("/export-report")
def export_report(request: RouteRequest):
    """
    Recomputes the route (for hackathon simplicity - a production
    version would cache the last computed route by ID instead of
    recomputing) and generates a PDF summary.
    """
    ice_data = forecast_ice_concentration(days=5)
    iceberg_positions = get_predicted_iceberg_positions()

    start = {"lat": request.start.lat, "lon": request.start.lon}
    end = {"lat": request.end.lat, "lon": request.end.lon}
    vessel = request.vessel.dict()

    recommended_waypoints = astar_route(start, end, ice_data, iceberg_positions, risk_weight=3.0)
    distance, fuel, time_hours = compute_route_stats(recommended_waypoints, vessel)

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4

    y = height - 2 * cm
    c.setFont("Helvetica-Bold", 16)
    c.drawString(2 * cm, y, "Antarctic Navigation Route Report")
    y -= 1 * cm

    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, f"Generated: {datetime.utcnow().strftime('%Y-%m-%d %H:%M UTC')}")
    y -= 0.7 * cm
    c.drawString(2 * cm, y, f"From: {request.start.name or 'Custom point'} ({request.start.lat}, {request.start.lon})")
    y -= 0.7 * cm
    c.drawString(2 * cm, y, f"To: {request.end.name or 'Custom point'} ({request.end.lat}, {request.end.lon})")
    y -= 1 * cm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(2 * cm, y, "Recommended Route Summary")
    y -= 0.8 * cm
    c.setFont("Helvetica", 10)
    c.drawString(2 * cm, y, f"Distance: {distance:.1f} nautical miles")
    y -= 0.6 * cm
    c.drawString(2 * cm, y, f"Estimated fuel: {fuel:.1f} tons")
    y -= 0.6 * cm
    c.drawString(2 * cm, y, f"Estimated time: {time_hours:.1f} hours")
    y -= 1 * cm

    c.setFont("Helvetica-Bold", 12)
    c.drawString(2 * cm, y, "Waypoints")
    y -= 0.8 * cm
    c.setFont("Helvetica", 9)
    for i, wp in enumerate(recommended_waypoints):
        c.drawString(2 * cm, y, f"{i+1}. lat={wp['lat']:.3f}, lon={wp['lon']:.3f}")
        y -= 0.5 * cm
        if y < 3 * cm:
            c.showPage()
            y = height - 2 * cm

    y -= 0.5 * cm
    c.setFont("Helvetica-Oblique", 8)
    c.drawString(2 * cm, y, "Note: Sea-ice data from NOAA/NSIDC G02202 v6 (real observed, day 0) with")
    y -= 0.4 * cm
    c.drawString(2 * cm, y, "documented persistence-based extrapolation beyond day 0. Iceberg positions from")
    y -= 0.4 * cm
    c.drawString(2 * cm, y, "physics-informed model validated against real BYU/NIC tracking data.")

    c.save()
    buffer.seek(0)

    return Response(
        content=buffer.read(),
        media_type="application/pdf",
        headers={"Content-Disposition": "attachment; filename=route_report.pdf"}
    )