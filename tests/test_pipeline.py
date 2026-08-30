import os
import json
import pytest
import pandas as pd

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
VALIDATED_DIR = os.path.join(DATA_DIR, "validated")
TRAINING_DIR = os.path.join(DATA_DIR, "training")
PREDICTIONS_DIR = os.path.join(DATA_DIR, "predictions")
MODELS_DIR = os.path.join(BASE_DIR, "models")

def test_ground_truth_coordinates():
    csv_path = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")
    assert os.path.exists(csv_path), "Ground truth CSV does not exist"
    df = pd.read_csv(csv_path)
    assert len(df) > 0, "Ground truth dataset is empty"
    assert (df['latitude'] >= -90.0).all() and (df['latitude'] <= 90.0).all()
    assert (df['longitude'] >= -180.0).all() and (df['longitude'] <= 180.0).all()
    # Check India bounding box
    assert (df['latitude'] >= 6.0).all() and (df['latitude'] <= 37.0).all()
    assert (df['longitude'] >= 68.0).all() and (df['longitude'] <= 97.0).all()

def test_master_ml_dataset():
    parquet_path = os.path.join(TRAINING_DIR, "master_manganese_training.parquet")
    csv_path = os.path.join(TRAINING_DIR, "master_manganese_training.csv")
    assert os.path.exists(parquet_path) or os.path.exists(csv_path), "Master training dataset does not exist"
    try:
        df = pd.read_parquet(parquet_path)
    except Exception:
        df = pd.read_csv(csv_path)
    assert len(df) == 496, f"Expected 496 rows, got {len(df)}"
    assert df.isnull().sum().sum() == 0, "Found null values in ML training set"
    assert "spatial_block_id" in df.columns, "Missing spatial_block_id column"
    assert "spatial_split" in df.columns, "Missing spatial_split column"

def test_spatial_split_leakage():
    parquet_path = os.path.join(TRAINING_DIR, "master_manganese_training.parquet")
    csv_path = os.path.join(TRAINING_DIR, "master_manganese_training.csv")
    try:
        df = pd.read_parquet(parquet_path)
    except Exception:
        df = pd.read_csv(csv_path)
    train_blocks = set(df[df['spatial_split'] == 'train']['spatial_block_id'])
    test_blocks = set(df[df['spatial_split'] == 'test']['spatial_block_id'])
    val_blocks = set(df[df['spatial_split'] == 'validation']['spatial_block_id'])
    
    assert len(train_blocks.intersection(test_blocks)) == 0, "Spatial leakage between train and test blocks!"
    assert len(train_blocks.intersection(val_blocks)) == 0, "Spatial leakage between train and validation blocks!"

def test_model_artifacts():
    model_pkl = os.path.join(MODELS_DIR, "best_manganese_model.pkl")
    schema_json = os.path.join(MODELS_DIR, "feature_schema.json")
    metrics_json = os.path.join(MODELS_DIR, "model_metrics.json")
    
    assert os.path.exists(model_pkl), "Best model pkl missing"
    assert os.path.exists(schema_json), "Feature schema JSON missing"
    assert os.path.exists(metrics_json), "Model metrics JSON missing"
    
    with open(schema_json) as f:
        schema = json.load(f)
        assert len(schema["feature_names"]) == 17, "Expected 17 input features"

def test_priority_zones_geojson():
    zones_json = os.path.join(PREDICTIONS_DIR, "priority_zones.geojson")
    assert os.path.exists(zones_json), "Priority zones GeoJSON missing"
    with open(zones_json) as f:
        data = json.load(f)
        assert data.get("type") == "FeatureCollection"
        features = data.get("features", [])
        assert len(features) > 0, "Priority zones list is empty"
        props = features[0].get("properties", {})
        assert "prospectivity_score" in props
        assert "confidence_percent" in props
