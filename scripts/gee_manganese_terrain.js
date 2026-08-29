
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
