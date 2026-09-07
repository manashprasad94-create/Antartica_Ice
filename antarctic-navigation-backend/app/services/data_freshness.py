"""
Centralized data-freshness checking. Since real satellite/tracking
data can be stale or missing (a genuine, expected condition for
Antarctic operations - not an edge case to hide), this module provides
a consistent way to flag it across all endpoints rather than silently
serving old data as if it were current.
"""

from datetime import datetime, timedelta


def check_staleness(last_data_date_str: str, max_age_days: int = 7):
    """
    Returns (is_stale: bool, age_days: int) for a given last-known-good
    data date string ("YYYY-MM-DD").
    """
    last_date = datetime.strptime(last_data_date_str, "%Y-%m-%d")
    age = (datetime.utcnow() - last_date).days
    return age > max_age_days, age