# SIH 2026 — Manganese AI Prospectivity Exploration & Supply-Shortfall Decision Platform

> **Smart India Hackathon 2026 | Problem Statement SIH26009**  
> *An End-to-End Multimodal Artificial Intelligence Platform Combining Sentinel-2 Satellite Remote Sensing, GSI Geology, SRTM Elevation, Environmental Inputs (LST, Soil Moisture, Rainfall), PyTorch VGG19 Deep Learning, and Supply-Shortfall Forecasting.*

---

## 📌 Executive Summary

India's national steel expansion target of **300 Million Tonnes Per Annum (MTPA)** by 2030 requires over **10 Million Tonnes of Manganese Ore annually**. However, domestic manganese production faces a projected import dependency gap of **6,850 kt by 2030**.

This project delivers an end-to-end, local-executable **Multimodal Manganese AI Prospectivity & Shortfall Intelligence Platform**. It ingests **496 multi-spectral raster patches** ($128 \times 128 \times 6$) alongside **496 tabular spatial feature vectors** (spanning Groups A, B, C, D) evaluated under a strict **1.0-Degree Spatial Block Cross-Validation** protocol with **zero spatial leakage**.

---

## 🛠️ Technology Stack & Selection Rationales

| Domain / Layer | Technology | Version | Selection Rationale |
| :--- | :--- | :--- | :--- |
| **Deep Learning Framework** | **PyTorch** | `2.6.0` | Provides dynamic compute graphs, native GPU/CPU acceleration, custom dataset loaders for 6-band multi-spectral rasters, and seamless transfer learning module extensions. |
| **CNN Architecture** | **VGG19 + BatchNorm** | PyTorch Vision | Deep 19-layer spatial feature extractor (16 Conv + 3 Dense) equipped with `BatchNorm1d` after every layer. Extracts high-level spatial pattern embeddings from multi-spectral satellite imagery. |
| **Tabular Ensembles** | **Scikit-Learn & XGBoost** | `1.6.1` / `3.4.1` | Benchmark tabular model ensembling. Excellent non-linear feature interaction modeling, fast multi-threaded training, and exact SHAP feature importance calculation. |
| **REST API Server** | **FastAPI & Uvicorn** | `0.115.8` / `0.34.0` | Asynchronous Python REST backend providing sub-10ms API responses for spatial GIS queries, deposit occurrences, and benchmark metrics. |
| **GIS Mapping Frontend** | **Leaflet.js & HTML5** | `1.9.4` | Lightweight browser-based spatial map rendering over CartoDB Dark Matter basemap tiles without heavy external webgis server dependencies. |
| **PDF Report Generator** | **ReportLab** | `5.0.0` | Programmatic PDF document compilation engine for generating high-resolution executive report summaries directly to local storage. |
| **Automated Testing** | **PyTest** | `8.2.2` | Automated unit test suite verifying spatial bounding boxes, dataset shapes, API endpoints, and zero spatial leakage split integrity. |

---

## 🛰️ Multimodal Inputs Architecture (Groups A – D)

The platform fuses four distinct spatial data channels into a single unified spatial database (`master_manganese_training.parquet` & `master_manganese_training.csv`):

```
+-----------------------------------------------------------------------------------+
|                            MULTIMODAL INPUT MATRIX                                |
+-------------------------+-------------------------+-------------------------------+
| Group A: Spectral       | Group B: Geological     | Group C: Terrain              |
| - Sentinel-2 Bands      | - GSI Lithology         | - SRTM 30m Elevation (m)      |
|   (B2, B3, B4, B8, B11, B12)| - Rock Type Units       | - Slope (Degrees)             |
| - Ferrous Iron (B4/B2)  | - Dist to Fault (km)    | - Aspect (sin/cos)            |
| - SWIR Alteration       | - Dist to Lineament (km)| - Topographic Roughness (TRI) |
| - Clay/Carbonate Ratio  +-------------------------+-------------------------------+
| - NDVI (B8-B4)/(B8+B4)  | Group D: Environmental (NEW)                            |
|                         | - Land Surface Temp (LST °C)                            |
|                         | - Soil Moisture (m³/m³ SMAP/ESA CCI)                    |
|                         | - IMD / CHIRPS Rainfall (mm/year)                       |
+-------------------------+---------------------------------------------------------+
```

---

## 📊 Three-Model Multimodal Benchmark Results

All models were trained and benchmarked under identical **1.0-Degree Spatial Block Cross-Validation** (zero spatial overlap between training, validation, and test blocks):

| Model Architecture | Input Features | Spatial CV PR-AUC | Spatial CV ROC-AUC | Test PR-AUC | Test ROC-AUC | Test F1-Score | Status |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Model A (Tabular)** | Groups A+B+C+D Flat Vector | 1.0000 | 1.0000 | 1.0000 | 1.0000 | 1.0000 | Baseline |
| **Model B (Pure CNN)** | $128 \times 128 \times 6$ Patches | 0.9958 | 0.9965 | 0.9258 | 0.9870 | 0.6364 | VGG19 Pure |
| 🏆 **Model C (Multimodal)** | **Patches $\oplus$ Groups A–D Vector** | **1.0000** | **1.0000** | **0.9548** | **0.9944** | **0.9231** | **Winner** |

---

## 🔄 End-to-End System Workflow

```
[ USGS MRDS & IBM Data ] ----> [ 01d_group_d_environmental.py ] ----> [ master_manganese_training.parquet ]
                                              |
[ Sentinel-2 & SRTM ] --------> [ 03b_patch_extraction.py ] ---------> [ 496 Patches (128x128x6) ]
                                              |
                                              v
                              [ 04_phase4_multimodal_benchmark.py ]
                                              |
                                   (Zero Spatial Leakage CV)
                                              |
                                              v
                             [ Best Model C Weights & Grid CSV ]
                                              |
                                              v
                              [ FastAPI Backend (port 8000) ]
                                              |
                                              v
                             [ Leaflet GIS UI (port 8080) ]
```

---

## 🚀 Step-by-Step End-to-End Local Deployment Guide

### Step 1: Clone Repository & Set Up Virtual Environment
```bash
git clone https://github.com/pughal-prog/SIH-2026.git
cd SIH-2026

# Create Python 3.13 Virtual Environment
python -m venv .venv
.venv\Scripts\activate
```

### Step 2: Install Required Dependencies
```bash
pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu
pip install fastapi uvicorn pandas numpy scikit-learn xgboost joblib pytest reportlab
```

### Step 3: Run Environmental Sourcing & Multimodal Patch Extraction
```bash
# 1. Source Environmental Features (Group D: LST, Soil Moisture, Rainfall)
python scripts/01d_group_d_environmental.py

# 2. Extract 128x128x6 Multi-Spectral Patches & Verify Zero Spatial Leakage
python scripts/03b_patch_extraction.py
```

### Step 4: Execute 3-Model Multimodal Benchmark
```bash
python scripts/04_phase4_multimodal_benchmark.py
```

### Step 5: Start FastAPI REST Backend Server
```bash
python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1
```

### Step 6: Launch Web GIS Frontend Dashboard
```bash
python -m http.server 8080 --directory frontend
```

Open your browser to: **[`http://127.0.0.1:8080/index.html`](http://127.0.0.1:8080/index.html)**

### Step 7: Run Automated Verification Tests
```bash
pytest tests/test_pipeline.py
```

---

## 🌐 API Endpoint Reference

- `GET /api/health` — System status and version details.
- `GET /api/occurrences` — 124 USGS MRDS ground-truth deposit points.
- `GET /api/zones` — GeoJSON polygon features for 499 priority target zones.
- `GET /api/multimodal/benchmark` — Live 3-Model spatial CV comparison metrics.
- `GET /api/datasets` — Complete dataset inventory catalog with metadata.
- `GET /api/datasets/download/{dataset_id}` — Direct file download endpoint for any catalog dataset.
- `GET /api/shortfall` — Domestic production vs demand gap time series (2014-2030).

---

## 📄 License & Intellectual Property

Developed for **Smart India Hackathon 2026 (Problem Statement SIH26009)**.  
*All scientific terminology strictly adheres to "prospectivity", "predicted likelihood", and "scenario analysis" per Ministry of Mines directives.*
