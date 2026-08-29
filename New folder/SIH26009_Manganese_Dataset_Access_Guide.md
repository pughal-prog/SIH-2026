# SIH26009 — Manganese Dataset Access Guide

**Problem statement:** Using AI/ML and Space Technology to Identify Manganese Reserves and Overcome Production Shortfalls

This is your working checklist of where to actually get each dataset, what to search for once you're on the portal, and what access hurdle to expect (open download vs. registration vs. license check).

---

## 🇮🇳 Indian Government Sources

### 1. GSI — Manganese Ore Deposits of India
- **Portal:** https://www.data.gov.in
- **Search inside portal for:** `manganese ore deposits` or `GSI mineral deposits`
- **Publisher:** Geological Survey of India (GSI), under Open Government Data (OGD) Platform India
- **Access:** Open download (CSV/XLS), registration optional
- **Note:** OGD's search UI changes dataset URLs often — search by title rather than trying to bookmark a deep link. If it's not under data.gov.in, also check GSI's own portal: https://www.gsi.gov.in (Publications → Geodata)

### 2. National Geoscience Data Repository (NGDR)
- **Portal:** https://ngdr.gsi.gov.in
- **What to look for:** Geological, geochemical, geophysical, and mineral-occurrence layers; login required for most exploration-grade data
- **Access:** Free registration required (Ministry of Mines / GSI nodal agency); **check each layer's license/access tag before use** — not everything is bulk-downloadable
- **Action item:** Register early — approval isn't instant, and this is your best India-specific exploration-evidence source

### 3. ISRO Bhuvan (thematic maps, LULC, terrain)
- **Portal:** https://bhuvan.nrsc.gov.in
- **Access:** Free download for most thematic layers (LULC, geomorphology, etc.), some need registration

### 4. ISRO Bhoonidhi (satellite scene ordering — Sentinel-2, Resourcesat, etc.)
- **Portal:** https://bhoonidhi.nrsc.gov.in
- **Registration:** https://uops.nrsc.gov.in/ImgeosUops/FinalImgeosUops/OdapUserRegister.html
- **Access:** Free registration required to download scenes
- **Bonus:** There's a community Python CLI (`pip install bhoonidhi-downloader`) that lets you search/download by bounding box + date range once you have credentials — useful for scripting bulk pulls instead of clicking through the UI.

### 5–8. Indian Bureau of Mines (IBM) — Yearbook, Reserves, Production, Grade-wise data
- **Portal:** https://ibm.gov.in
- **Where to look:** "Publications" → *Indian Minerals Yearbook* (manganese chapter, latest = 2024 edition) and "Monthly Statistics of Mineral Production"
- **Access:** Open PDF download, no login. These are report PDFs, not clean CSVs — you'll need to extract tables (I can help parse a specific PDF once you download it, or via the pdf skill if you upload it here).
- **What's in each:**
  - Yearbook manganese chapter → production, exports, imports, reserves, state-wise occurrence
  - Reserves/resources tables → NMI/UNFC-based, state + grade breakdown
  - Monthly production statistics → 2013–2026 time series
  - Grade-wise production → ≥46% Mn, 35–46%, 25–35%, <25%, MnO₂ splits by state/district

---

## 🌍 International / Satellite Sources

### 9. Sentinel-2 (Copernicus)
- **Portal:** https://dataspace.copernicus.eu
- **Product to pull:** Sentinel-2 **Level-2A** (surface reflectance, atmospherically corrected) — not raw L1C
- **Access:** Free, requires a Copernicus Data Space account. Also accessible programmatically via the `openeo` or `sentinelhub` Python APIs once registered.

### 10. USGS International Manganese Samples (Hewett Collection)
- **Direct page:** https://www.usgs.gov/data/international-manganese-samples-donnel-foster-hewett-collection
- **Access:** Public domain, **CC0 1.0** — direct download, no login
- **Contains:** lat/long, locality, sample type, mineral name, Mn-oxide qualitative volume, sample mass

### 11. USGS MRDS (Mineral Resources Data System)
- **Portal:** https://mrdata.usgs.gov/mrds
- **Access:** Open download (shapefile/CSV), no login

### 12. USGS Manganese Statistics and Information
- **Portal:** https://www.usgs.gov/centers/national-minerals-information-center/manganese-statistics-and-information
- **Contains:** Annual Mineral Commodity Summaries (through 2026) + monthly global supply/demand/price data
- **Access:** Open PDF/XLS download

### 13. USGS Earth MRI
- **Portal:** https://www.usgs.gov/special-topics/earth-mri
- **Access:** Mixed — some GIS layers openly downloadable via USGS ScienceBase, some are collection-in-progress. Search ScienceBase (https://www.sciencebase.gov) for "Earth MRI" + manganese/critical minerals for specific layers.

### 14. SRTM DEM (elevation/terrain)
- **Portal:** NASA Earthdata / LP DAAC — https://earthexplorer.usgs.gov or https://www.earthdata.nasa.gov
- **Product:** SRTMGL1.003, 30 m resolution
- **Access:** Free NASA Earthdata login required, then direct download or via Earth Engine (`USGS/SRTMGL1_003` if you use Google Earth Engine instead — much easier for deriving slope/aspect/TRI programmatically)

---

## Practical sequencing for your team

1. **Today:** Register for NGDR, Bhoonidhi/UOPS login, Copernicus Data Space, and NASA Earthdata — these all have approval lag, so start now even before you write code.
2. **No-login, start immediately:** GSI/OGD manganese CSV, IBM PDFs, USGS Hewett CC0 dataset, USGS MRDS, USGS manganese statistics.
3. Once you have a GSI manganese-locality CSV, use those lat/lon points to query Sentinel-2 (via Copernicus or Earth Engine) and SRTM — that's your positive-sample spectral/terrain feature set.
4. Use IBM Yearbook + monthly stats for the production/shortfall side of the model, kept separate from your AI-prospectivity output (don't let the model imply it "predicted" IBM's official reserve figures).

If you paste in a specific PDF (like the IBM Yearbook manganese chapter) once you've downloaded it, I can help you extract the tables into clean CSVs directly.
