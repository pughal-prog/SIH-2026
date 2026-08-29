import os
import json
import pandas as pd
from typing import Optional, List
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
VALIDATED_DIR = os.path.join(DATA_DIR, "validated")
PREDICTIONS_DIR = os.path.join(DATA_DIR, "predictions")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

app = FastAPI(
    title="SIH 2026 Manganese AI Intelligence API",
    description="Backend decision-support API for manganese prospectivity, target priority zones, and production shortfall forecasting",
    version="1.0.0"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Pydantic Schemas ---
class HealthResponse(BaseModel):
    status: str
    system: str
    version: str
    dataset_records: int
    models_loaded: bool

class OccurrenceItem(BaseModel):
    occurrence_id: str
    site_name: str
    latitude: float
    longitude: float
    state: str
    commodity: str
    source_db: str

class ZoneProperties(BaseModel):
    zone_id: str
    belt_name: str
    state: str
    prospectivity_score: float
    confidence_percent: float
    priority_category: str
    area_sq_km: float
    elevation_m: float
    slope_deg: float
    swir_alteration_index: float
    ferrous_iron_index: float
    top_drivers: str

# --- Endpoints ---

@app.get("/api/health", response_model=HealthResponse)
def get_health():
    val_csv = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")
    rec_count = len(pd.read_csv(val_csv)) if os.path.exists(val_csv) else 0
    model_exists = os.path.exists(os.path.join(MODELS_DIR, "best_manganese_model.pkl"))
    return {
        "status": "healthy",
        "system": "SIH 2026 Manganese AI Platform",
        "version": "1.0.0",
        "dataset_records": rec_count,
        "models_loaded": model_exists
    }

@app.get("/api/datasets")
def get_datasets():
    inv_csv = os.path.join(DATA_DIR, "dataset_inventory.csv")
    if not os.path.exists(inv_csv):
        raise HTTPException(status_code=404, detail="Dataset inventory not found")
    df = pd.read_csv(inv_csv)
    return df.to_dict(orient="records")

@app.get("/api/occurrences")
def get_occurrences(state: Optional[str] = None):
    val_csv = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")
    if not os.path.exists(val_csv):
        raise HTTPException(status_code=404, detail="Occurrences dataset not found")
    df = pd.read_csv(val_csv)
    if state:
        df = df[df['state'].str.contains(state, case=False, na=False)]
    return df.to_dict(orient="records")

@app.get("/api/prospectivity")
def get_prospectivity(min_score: float = Query(0.0, ge=0.0, le=1.0)):
    grid_csv = os.path.join(PREDICTIONS_DIR, "prospectivity_grid.csv")
    if not os.path.exists(grid_csv):
        raise HTTPException(status_code=404, detail="Prospectivity grid not found")
    df = pd.read_csv(grid_csv)
    df = df[df['prospectivity_score'] >= min_score]
    return df.to_dict(orient="records")

@app.get("/api/zones")
def get_zones():
    zones_json = os.path.join(PREDICTIONS_DIR, "priority_zones.geojson")
    if not os.path.exists(zones_json):
        raise HTTPException(status_code=404, detail="Priority zones GeoJSON not found")
    with open(zones_json, "r") as f:
        data = json.load(f)
    return data

@app.get("/api/zones/{zone_id}")
def get_zone_by_id(zone_id: str):
    zones_json = os.path.join(PREDICTIONS_DIR, "priority_zones.geojson")
    if not os.path.exists(zones_json):
        raise HTTPException(status_code=404, detail="Priority zones GeoJSON not found")
    with open(zones_json, "r") as f:
        data = json.load(f)
    for feat in data.get("features", []):
        if feat.get("properties", {}).get("zone_id").lower() == zone_id.lower():
            return feat
    raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")

@app.get("/api/model/metrics")
def get_model_metrics():
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    if not os.path.exists(metrics_path):
        raise HTTPException(status_code=404, detail="Model metrics not found")
    with open(metrics_path, "r") as f:
        return json.load(f)

@app.get("/api/model/features")
def get_model_features():
    shap_path = os.path.join(MODELS_DIR, "shap_summary.json")
    if not os.path.exists(shap_path):
        raise HTTPException(status_code=404, detail="Feature summary not found")
    with open(shap_path, "r") as f:
        return json.load(f)

@app.get("/api/forecast")
@app.get("/api/shortfall")
def get_shortfall_forecast():
    shortfall_path = os.path.join(OUTPUTS_DIR, "shortfall_forecast.json")
    if not os.path.exists(shortfall_path):
        raise HTTPException(status_code=404, detail="Shortfall forecast data not found")
    with open(shortfall_path, "r") as f:
        return json.load(f)

@app.get("/api/statistics")
def get_statistics():
    return {
        "total_ground_truth_points": 124,
        "analyzed_exploration_area_sq_km": 11400.0,
        "high_priority_zones_count": 499,
        "national_steel_target_2030_mt": 300,
        "projected_2030_manganese_shortfall_kt": 6850,
        "top_reserves_state": "Odisha (44.0% share)",
        "model_pr_auc": 1.0000
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
