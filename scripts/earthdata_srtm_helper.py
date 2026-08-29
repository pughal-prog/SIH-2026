"""
NASA Earthdata SRTM 30m DEM & Google Earth Engine (GEE) Terrain Feature Generator
Product: SRTMGL1.003 (30m Resolution)
Portal: https://earthexplorer.usgs.gov / https://earthdata.nasa.gov
GEE Asset: USGS/SRTMGL1_003

This script generates Python code and GEE JavaScript snippets to compute:
  1. Elevation (meters above sea level)
  2. Terrain Slope (degrees)
  3. Terrain Aspect (cardinal direction / illumination)
  4. Topographic Roughness Index (TRI)
"""

import os
import json

def print_gee_terrain_code():
    gee_js = """
// ===================================================================
// Google Earth Engine (GEE) Script for Manganese Exploration Terrain
// Target: India Manganese Belts (Odisha, MP/MH, Karnataka, AP)
// ===================================================================

// 1. Load SRTM 30m Digital Elevation Model
var srtm = ee.Image('USGS/SRTMGL1_003');

// 2. Define Manganese Belt AOI (Odisha Example)
var aoi = ee.Geometry.Rectangle([82.5, 18.2, 86.8, 22.4]);

// 3. Clip SRTM to AOI
var dem = srtm.clip(aoi);

// 4. Compute Terrain Attributes
var slope = ee.Terrain.slope(dem);
var aspect = ee.Terrain.aspect(dem);
var hillshade = ee.Terrain.hillshade(dem);

// 5. Compute Topographic Roughness Index (TRI)
var mean3x3 = dem.reduceNeighborhood({
  reducer: ee.Reducer.mean(),
  kernel: ee.Kernel.square(1)
});
var tri = dem.subtract(mean3x3).abs();

// 6. Visualization Palette
Map.centerObject(aoi, 8);
Map.addLayer(dem, {min: 0, max: 1200, palette: ['0000ff', '00ffff', 'ffff00', 'ff0000']}, 'Elevation (m)');
Map.addLayer(slope, {min: 0, max: 45}, 'Slope (deg)');
Map.addLayer(tri, {min: 0, max: 50}, 'Topographic Roughness Index');

// 7. Export Feature Raster to Drive / Cloud Storage
Export.image.toDrive({
  image: dem.addBands(slope).addBands(aspect).addBands(tri),
  description: 'Manganese_Belt_Terrain_30m',
  scale: 30,
  region: aoi,
  fileFormat: 'GeoTIFF'
});
"""

    print("\n=======================================================")
    print(" Google Earth Engine (GEE) Terrain Extraction Script")
    print("=======================================================")
    print(gee_js)
    print("=======================================================\n")

    # Save to file
    gee_file = os.path.join("scripts", "gee_manganese_terrain.js")
    with open(gee_file, "w") as f:
        f.write(gee_js)
    print(f"[+] Exported GEE JavaScript snippet to: {gee_file}")

if __name__ == "__main__":
    print_gee_terrain_code()
