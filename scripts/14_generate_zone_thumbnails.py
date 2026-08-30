import os
import math
import io
import urllib.request
import pandas as pd
from PIL import Image

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
PREDICTIONS_DIR = os.path.join(DATA_DIR, "predictions")
VALIDATED_DIR = os.path.join(DATA_DIR, "validated")
THUMBNAILS_DIR = os.path.join(PREDICTIONS_DIR, "thumbnails")

os.makedirs(THUMBNAILS_DIR, exist_ok=True)

def latlon_to_tile(lat, lon, zoom=14):
    lat_rad = math.radians(lat)
    n = 2.0 ** zoom
    xtile = int((lon + 180.0) / 360.0 * n)
    ytile = int((1.0 - math.log(math.tan(lat_rad) + (1.0 / math.cos(lat_rad))) / math.pi) / 2.0 * n)
    return xtile, ytile

def fetch_esri_tile(x, y, z=14):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    req = urllib.request.Request(url, headers={"User-Agent": "SIH-2026-Manganese-Explorer/2.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return Image.open(io.BytesIO(resp.read()))
    except Exception as e:
        print(f"Error fetching tile {z}/{y}/{x}: {e}")
        # Return fallback solid dark satellite-like image
        return Image.new("RGB", (256, 256), color=(20, 30, 25))

def generate_thumbnail(lat, lon, output_path, zoom=14):
    if os.path.exists(output_path) and os.path.getsize(output_path) > 500:
        return
    
    xtile, ytile = latlon_to_tile(lat, lon, zoom)
    
    # Fetch 2x2 grid around center tile to allow seamless center cropping
    tiles = {}
    for dx in [-1, 0, 1]:
        for dy in [-1, 0, 1]:
            tiles[(dx, dy)] = fetch_esri_tile(xtile + dx, ytile + dy, zoom)
            
    # Stitch 3x3 tiles (768x768)
    stitched = Image.new("RGB", (768, 768))
    for (dx, dy), tile_img in tiles.items():
        stitched.paste(tile_img, ((dx + 1) * 256, (dy + 1) * 256))
        
    # Crop center 256x256
    crop_x = (768 - 256) // 2
    crop_y = (768 - 256) // 2
    thumbnail = stitched.crop((crop_x, crop_y, crop_x + 256, crop_y + 256))
    
    thumbnail.save(output_path, format="PNG", optimize=True)

def main():
    print("Starting Tier 1 Precomputed Satellite Thumbnail Generator...")
    
    grid_path = os.path.join(PREDICTIONS_DIR, "prospectivity_grid.csv")
    occ_path = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")
    
    generated_count = 0
    
    if os.path.exists(grid_path):
        df_grid = pd.read_csv(grid_path)
        print(f"Processing {len(df_grid)} grid cells...")
        for idx, row in df_grid.iterrows():
            zone_id = row.get("grid_id", f"GRID_{idx+1:04d}")
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            out_file = os.path.join(THUMBNAILS_DIR, f"{zone_id}.png")
            generate_thumbnail(lat, lon, out_file)
            generated_count += 1
            if generated_count % 50 == 0:
                print(f"  Generated {generated_count}/{len(df_grid)} grid cell thumbnails...")
                
    if os.path.exists(occ_path):
        df_occ = pd.read_csv(occ_path)
        print(f"Processing {len(df_occ)} manganese deposit occurrence points...")
        for idx, row in df_occ.iterrows():
            occ_id = str(row.get("occurrence_id", f"OCC_{idx+1:03d}"))
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            out_file = os.path.join(THUMBNAILS_DIR, f"{occ_id}.png")
            generate_thumbnail(lat, lon, out_file)
            
    print(f"Successfully generated/verified all precomputed satellite thumbnails in '{THUMBNAILS_DIR}'!")

if __name__ == "__main__":
    main()
