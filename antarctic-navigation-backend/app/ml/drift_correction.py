"""
ML residual correction layer for iceberg drift prediction.

The physics model gives a baseline prediction. This model learns the
systematic error (residual) between physics prediction and actual
observed position, using historical data, and corrects future
predictions accordingly.

For hackathon data volume (a handful of historical points), we use a
simple linear regression as the residual model — this is intentional,
not a limitation: with very few training examples, a complex model
would overfit. A small XGBoost model can replace this once more real
historical data is available (documented as a Phase 2 upgrade).
"""

import numpy as np
from sklearn.linear_model import LinearRegression
import joblib
import os

MODEL_PATH = os.path.join(os.path.dirname(__file__), "residual_model.joblib")


def train_residual_model(residuals_lat, residuals_lon, features):
    """
    features: list of [wind_u, wind_v, current_u, current_v] per sample
    residuals_lat/lon: actual_lat - predicted_lat (and lon), in degrees

    Trains two simple linear models (one for lat correction, one for lon)
    and saves them together.
    """
    X = np.array(features)

    model_lat = LinearRegression()
    model_lat.fit(X, residuals_lat)

    model_lon = LinearRegression()
    model_lon.fit(X, residuals_lon)

    joblib.dump({"model_lat": model_lat, "model_lon": model_lon}, MODEL_PATH)
    return model_lat, model_lon


def load_residual_model():
    if not os.path.exists(MODEL_PATH):
        return None
    return joblib.load(MODEL_PATH)


def correct_prediction(predicted_lat, predicted_lon, wind_u, wind_v, current_u, current_v):
    """
    Apply the learned correction to a physics-based prediction.
    Falls back to uncorrected prediction if no model is trained yet.
    """
    models = load_residual_model()
    if models is None:
        return predicted_lat, predicted_lon, 0.0, 0.0

    X = np.array([[wind_u, wind_v, current_u, current_v]])
    correction_lat = models["model_lat"].predict(X)[0]
    correction_lon = models["model_lon"].predict(X)[0]

    corrected_lat = predicted_lat + correction_lat
    corrected_lon = predicted_lon + correction_lon

    return corrected_lat, corrected_lon, correction_lat, correction_lon