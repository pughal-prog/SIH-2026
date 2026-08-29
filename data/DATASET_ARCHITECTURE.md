# SIH 2026 — Manganese Dataset Relationship & Pipeline Architecture

This document describes the data flow, dataset relationships, and join architecture for the **Manganese Prospectivity & Production Shortfall Prediction Pipeline**.

---

## 1. High-Level Data Architecture Diagram

```
                 GSI / USGS MRDS Mn Occurrences (138 India Points)
                                     │
          ┌──────────────────────────┼──────────────────────────┐
          ↓                          ↓                          ↓
    Sentinel-2 L2A               GSI Geology                 SRTM DEM
   (SWIR B11/B12, Red B4)   (Lithology, Lineaments)     (Elevation, Slope, TRI)
          │                          │                          │
          ↓                          ↓                          ↓
   Spectral Features        Geological Features          Terrain Features
          └──────────────────────────┼──────────────────────────┘
                                     ↓
                         MASTER ML FEATURE MATRIX
                                     ↓
                      Manganese Prospectivity Model
                                     ↓
                  High-Potential Exploration Heatmaps


        IBM UNFC Reserves  +  IBM Grade Production  +  USGS World Stats
                                     ↓
                         Manganese Supply-Demand Dataset
                                     ↓
                     Production Shortfall Forecast Model
```

---

## 2. Component Dataset Mapping

### A. AI/ML Prospectivity Branch (Spatial Exploration Model)
1. **Target Labels ($y$):**
   - Source: `data/processed/usgs_mrds_manganese_india.csv` (138 confirmed deposit locations)
   - Benchmark: `data/processed/usgs_hewett_manganese_samples.csv` (743 physical mineral samples)
2. **Spatial AOI Bounding Masks:**
   - Source: `data/bounds/manganese_belts_india.geojson` (Odisha, MP-MH, Karnataka, AP)
3. **Space Technology & Remote Sensing Features ($X_{sat}$):**
   - Source: Copernicus Sentinel-2 L2A via `scripts/copernicus_sentinel_helper.py`
   - Features: Band 4/Band 2 (Ferrous Iron Index), Band 11/Band 12 (SWIR Hydrothermal Alteration Index)
4. **Terrain & Elevation Features ($X_{dem}$):**
   - Source: SRTMGL1.003 30m DEM via `scripts/gee_manganese_terrain.js`
   - Features: Elevation (m), Slope (deg), Aspect, Topographic Roughness Index (TRI)

---

### B. Production Shortfall & Demand Forecasting Branch (Economic Model)
1. **Reserves Baseline:**
   - Source: `data/processed/ibm_manganese_reserves_unfc.csv` (State-wise UNFC 111, 121, 211, 333 reserves)
2. **Production Baseline:**
   - Source: `data/processed/ibm_manganese_production_gradewise.csv` (Grade breakdowns: ≥46% Mn, 35-46%, 25-35%, <25%, MnO₂)
3. **Global Market Context:**
   - Source: `data/processed/usgs_world_manganese_reserves_production.csv` & `data/raw/usgs_stats/mcs2024-manganese.pdf`

---

## 3. Data Join Specifications

### Join 1: Spatial Feature Extraction (MRDS Occurrences ↔ Satellite & DEM)
- **Primary Table:** `usgs_mrds_manganese_india.csv` (`dep_id`, `latitude`, `longitude`)
- **Secondary Rasters:** Sentinel-2 L2A Surface Reflectance, SRTM 30m DEM
- **Join Operation:** Spatial Point Intersect / $30\text{m} \times 30\text{m}$ pixel sample
- **Output:** Feature vector $(x_{\text{B4/B2}}, x_{\text{B11/B12}}, x_{\text{slope}}, x_{\text{elevation}}, x_{\text{TRI}})$ for each deposit coordinate.

### Join 2: Supply-Demand Alignment (IBM Reserves ↔ IBM Production)
- **Primary Table:** `ibm_manganese_reserves_unfc.csv` (`State`, `Total_Resources_kt`)
- **Secondary Table:** `ibm_manganese_production_gradewise.csv` (`State`, `Total_Production_kt`)
- **Join Operation:** Inner Join on key `State`
- **Output Metrics:**
  - Reserve-to-Production Ratio ($R/P = \frac{\text{Total Reserves}}{\text{Annual Production}}$)
  - Depletion rate and high-grade depletion risk index by state.

---

## 4. Pipeline Execution Sequence

```text
Step 1: Download & Ingest (COMPLETED)
Step 2: Scan & Validate Inventory (COMPLETED)
Step 3: Preprocessing & CRS Standardization (NEXT PHASE - DO NOT EXECUTE YET)
Step 4: Geospatial Feature Extraction & Alignment (FUTURE PHASE)
Step 5: Prospectivity ML Model Training & Shortfall Forecasting (FUTURE PHASE)
```
