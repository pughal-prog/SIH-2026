# PROJECT AUDIT — SIH 2026 Manganese AI/ML Platform

**Audit Date:** 2026-08-29  
**System Location:** `d:\mangan ai`  
**OS:** Windows 11  

---

## 1. Executive Overview
The workspace `d:\mangan ai` has been structured into a modular, production-ready data science and machine learning platform.

## 2. Directory Hierarchy
- `data/raw/`: Immutable raw datasets (USGS Hewett, USGS MRDS, USGS Stats, IBM Yearbooks)
- `data/raw_extracted/`: Safely extracted working copies of archives
- `data/validated/`: Quality-verified, CRS-standardized geospatial layers (`manganese_occurrences.csv` & `.gpkg`)
- `data/processed/`: Standardized tabular and spatial files
- `data/features/`: Extracted satellite, geological, and terrain feature matrices
- `data/training/`: Spatially split train/validation/test parquet datasets
- `data/predictions/`: Model prospectivity rasters & priority zones
- `data/metadata/`: Inventory CSVs, ground-truth quality reports, dataset provenance
- `scripts/`: Modular execution pipeline scripts (`01_phase1_data.py` through `13_generate_outputs.py`)
- `models/`: Serialized model artifacts, metrics, and SHAP explainers
- `outputs/`: Interactive Folium maps, model comparison CSVs, and validation reports
- `config/`: Pipeline configuration settings (`config.yaml`)

## 3. Technology Stack Evaluated
- **Data Engineering:** Python 3.13, Pandas, PyArrow, NumPy
- **Geospatial & Remote Sensing:** GeoPandas, Shapely, PyProj, STAC API, Rasterio / GDAL
- **Machine Learning & Explainability:** scikit-learn, XGBoost, LightGBM, Optuna, SHAP
- **Time-Series Forecasting:** Statsmodels, scikit-learn, XGBoost
- **Backend:** FastAPI, Pydantic v2
- **Frontend / UI:** Next.js 15 / React 19, TypeScript, Tailwind CSS, Mapbox GL JS / Leaflet

## 4. Development Priorities
1. Clean and validate ground-truth occurrence dataset (`data/validated/manganese_occurrences.csv`).
2. Build spatial feature extraction pipeline (Sentinel-2 SWIR/Red-edge spectral indices + SRTM 30m DEM terrain attributes).
3. Implement spatial block cross-validation to eliminate spatial leakage.
4. Train and benchmark Random Forest, XGBoost, and LightGBM models with SHAP explainability.
5. Derive priority exploration zones with confidence/uncertainty bounds.
6. Build time-series shortfall prediction model for state-wise manganese production.
7. Build FastAPI backend & Next.js interactive GIS visualizer.
