# SIH26009 — Manganese Dataset Access & Ingestion Master Guide

**Problem Statement:** Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls

---

## Workspace Structure (`d:\mangan ai`)

```
d:\mangan ai\
├── data\
│   ├── raw\
│   │   ├── usgs_hewett\          # Donnel Foster Hewett International Manganese Samples (CC0 1.0)
│   │   ├── usgs_mrds\            # USGS Mineral Resources Data System (Tab-delimited / CSV)
│   │   ├── usgs_stats\           # USGS Mineral Commodity Summaries & Monthly Stats
│   │   ├── ibm_yearbook\         # Indian Bureau of Mines Yearbook & Production PDFs
│   │   ├── gsi_ogd\              # GSI Manganese Ore Deposits & Occurrences
│   │   ├── satellite_sentinel2\   # AOI Surface Reflectance (Sentinel-2 L2A)
│   │   └── srtm_dem\             # SRTM 30m Elevation & Derived Slope/Aspect
│   ├── processed\                # Cleaned CSVs, GeoJSONs, Feature Matrices for AI/ML
│   │   ├── usgs_hewett_manganese_samples.csv
│   │   ├── usgs_mrds_manganese_india.csv
│   │   ├── usgs_mrds_manganese_global.csv
│   │   ├── usgs_world_manganese_reserves_production.csv
│   │   ├── ibm_manganese_reserves_unfc.csv
│   │   └── ibm_manganese_production_gradewise.csv
│   └── bounds\
│       └── manganese_belts_india.geojson
├── scripts\
│   ├── download_usgs_hewett.py   # Direct ScienceBase fetcher for Hewett CSVs
│   ├── download_usgs_mrds.py     # USGS MRDS zip downloader & Manganese filter
│   ├── download_usgs_stats.py    # USGS NMIC Manganese reports & tables fetcher
│   ├── download_ibm_yearbook.py  # IBM Yearbook NMI/UNFC reserves & grade parser
│   ├── create_manganese_belts_geojson.py # India manganese belt bounding box creator
│   ├── bhoonidhi_downloader_helper.py    # ISRO Bhoonidhi CLI & Bounding Box Satellite query
│   ├── copernicus_sentinel_helper.py     # Copernicus STAC / OpenEO query script
│   ├── earthdata_srtm_helper.py         # NASA Earthdata / DEM download & GEE terrain generator
│   └── gee_manganese_terrain.js          # Ready-to-run Google Earth Engine JavaScript
├── docs\
│   └── DATASET_ACCESS_GUIDE.md   # This master guide
└── requirements.txt
```

---

## 🇮🇳 Indian Government Sources

### 1. GSI — Manganese Ore Deposits of India
- **Portal:** https://www.data.gov.in
- **Search terms:** `manganese ore deposits` or `GSI mineral deposits`
- **Publisher:** Geological Survey of India (GSI), under Open Government Data (OGD) Platform India
- **Access:** Open download (CSV/XLS), registration optional.
- **Alternative GSI Portal:** https://www.gsi.gov.in (Publications → Geodata)

### 2. National Geoscience Data Repository (NGDR)
- **Portal:** https://ngdr.gsi.gov.in
- **Layers:** Geological, geochemical, geophysical, aeromagnetic, and mineral-occurrence layers
- **Search terms:** `manganese`, `mineral occurrence`, `geochemical baseline`, `aeromagnetic`, `manganese Odisha`, `manganese Madhya Pradesh`
- **Access:** Free registration required (Ministry of Mines / GSI nodal agency). Approval is not instant — register early! Check layer-level licenses before bulk export.

### 3. ISRO Bhuvan (thematic maps, LULC, terrain)
- **Portal:** https://bhuvan.nrsc.gov.in
- **Search terms:** Under *Thematic Services* → Land Use Land Cover (LULC), Geomorphology, Lithology
- **Access:** Free download for thematic layers; some require basic registration.

### 4. ISRO Bhoonidhi (satellite scene ordering — Sentinel-2, Resourcesat)
- **Portal:** https://bhoonidhi.nrsc.gov.in
- **Registration:** https://uops.nrsc.gov.in/ImgeosUops/FinalImgeosUops/OdapUserRegister.html
- **Access:** Free registration required to download scenes.
- **Python CLI Helper:** Executable via `scripts/bhoonidhi_downloader_helper.py`:
  ```bash
  python scripts/bhoonidhi_downloader_helper.py --belt "Odisha" --start "2023-01-01" --end "2024-01-01"
  ```

### 5–8. Indian Bureau of Mines (IBM) — Yearbook, Reserves, Production, Grade-wise data
- **Portal:** https://ibm.gov.in
- **Navigation:** Menu path: *Publications* → *Indian Minerals Yearbook* → *Manganese chapter* & *Monthly Statistics of Mineral Production*
- **Ingested CSVs in Workspace:**
  - `data/processed/ibm_manganese_reserves_unfc.csv` (State-wise NMI/UNFC Reserves: Proved 111, Probable 121, Feasibility, Inferred)
  - `data/processed/ibm_manganese_production_gradewise.csv` (Grade splits: ≥46% Mn, 35–46%, 25–35%, <25%, MnO₂ by state)

---

## 🌍 International / Satellite Sources

### 9. Sentinel-2 (Copernicus Data Space)
- **Portal:** https://dataspace.copernicus.eu
- **Product:** Sentinel-2 **Level-2A** (surface reflectance, atmospherically corrected code: `S2MSI2A`)
- **Query Script:** Executable via `scripts/copernicus_sentinel_helper.py` (STAC API query over manganese belt bounding boxes).
- **Mineral Ratios:**
  - Ferrous Iron / Oxide Index: Band 4 / Band 2
  - Hydrothermal Alteration Index (SWIR Ratio): Band 11 / Band 12

### 10. USGS International Manganese Samples (Hewett Collection)
- **ScienceBase Item ID:** `679ba27ed34ea8c1837736c7`
- **Access:** Public domain, **CC0 1.0** — direct download, no login required.
- **Ingested Files in Workspace:**
  - `data/raw/usgs_hewett/Hewett_Manganese_Collection.csv` (743 samples with Lat/Lon, locality, mineral name, sample mass, Mn oxide qualitative volume)
  - `data/processed/usgs_hewett_manganese_samples.csv`

### 11. USGS MRDS (Mineral Resources Data System)
- **Portal:** https://mrdata.usgs.gov/mrds
- **Access:** Open download (tab-delimited bulk database `rdbms-tab.zip`).
- **Ingested CSVs in Workspace:**
  - `data/processed/usgs_mrds_manganese_global.csv` (10,075 global Manganese deposit records)
  - `data/processed/usgs_mrds_manganese_india.csv` (138 India Manganese deposit records with exact coordinates, e.g. Barbil, Kodur, Laugur, Cape Gadani, Goguldoho)

### 12. USGS Manganese Statistics and Information
- **Portal:** https://www.usgs.gov/centers/national-minerals-information-center/manganese-statistics-and-information
- **Ingested Files in Workspace:**
  - `data/raw/usgs_stats/mcs2024-manganese.pdf` (USGS Mineral Commodity Summary 2024)
  - `data/processed/usgs_world_manganese_reserves_production.csv` (Global reserves & production by country: South Africa, Australia, Gabon, China, India, Brazil, etc.)

### 13. USGS Earth MRI
- **Portal:** https://www.usgs.gov/special-topics/earth-mri
- **ScienceBase search:** Search https://www.sciencebase.gov for `Earth MRI manganese` / `Earth MRI critical minerals geophysics`.

### 14. SRTM DEM (elevation/terrain)
- **Portal:** NASA Earthdata / LP DAAC — https://earthexplorer.usgs.gov or https://www.earthdata.nasa.gov
- **Product:** SRTMGL1.003 (30m resolution)
- **GEE Asset:** `USGS/SRTMGL1_003`
- **Executable Terrain Script:** `scripts/earthdata_srtm_helper.py` / `scripts/gee_manganese_terrain.js` (Computes Elevation, Slope, Aspect, and Topographic Roughness Index).

---

## Target Bounding Boxes for Indian Manganese Belts

All 4 primary Indian manganese belts are saved in EPSG:4326 format at `data/bounds/manganese_belts_india.geojson`:

1. **Odisha Belt (Keonjhar, Sundargarh, Rayagada, Koraput):**
   - `[82.5, 18.2, 86.8, 22.4]`
2. **Madhya Pradesh & Maharashtra Belt (Balaghat, Chhindwara, Nagpur, Bhandara):**
   - `[78.5, 20.8, 80.8, 22.4]`
3. **Karnataka Belt (Bellary, Shimoga, Uttara Kannada):**
   - `[74.2, 13.5, 77.2, 16.2]`
4. **Andhra Pradesh Belt (Srikakulam, Vizianagaram):**
   - `[83.0, 18.0, 84.8, 19.3]`

---

## How to Execute the Pipeline Scripts

```bash
# 1. Download/Update USGS Hewett Collection CSVs
python scripts/download_usgs_hewett.py

# 2. Download/Update USGS MRDS Tab Database & Filter Manganese (Global + India)
python scripts/download_usgs_mrds.py

# 3. Download USGS Mineral Commodity Summaries
python scripts/download_usgs_stats.py

# 4. Generate IBM Yearbook Reserves & Production CSVs
python scripts/download_ibm_yearbook.py

# 5. Generate GeoJSON Bounding Polygons
python scripts/create_manganese_belts_geojson.py

# 6. Query Copernicus STAC API
python scripts/copernicus_sentinel_helper.py

# 7. Generate Google Earth Engine Terrain Script
python scripts/earthdata_srtm_helper.py
```
