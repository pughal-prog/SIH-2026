import os
import math
import io
import time
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

def fetch_esri_tile(x, y, z=14, retries=3):
    url = f"https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) SIH-2026-Manganese-Explorer/2.0"})
    
    for attempt in range(retries):
        try:
            time.sleep(0.05)  # Rate limiting delay
            with urllib.request.urlopen(req, timeout=8) as resp:
                data = resp.read()
                if len(data) > 1000:
                    return Image.open(io.BytesIO(data))
        except Exception as e:
            if attempt < retries - 1:
                time.sleep(0.5 * (2 ** attempt))
            else:
                pass
                
    # Fallback to OpenStreetMap tile if ESRI fails
    osm_url = f"https://tile.openstreetmap.org/{z}/{x}/{y}.png"
    osm_req = urllib.request.Request(osm_url, headers={"User-Agent": "SIH-2026-Manganese-Explorer/2.0"})
    try:
        with urllib.request.urlopen(osm_req, timeout=5) as resp:
            return Image.open(io.BytesIO(resp.read()))
    except Exception:
        pass

    # Solid satellite-like dark green fallback image (256x256)
    img = Image.new("RGB", (256, 256), color=(25, 38, 30))
    return img

def generate_thumbnail(lat, lon, output_path, zoom=14):
    # Re-generate if file doesn't exist or is smaller than 2KB (corrupt/placeholder)
    if os.path.exists(output_path) and os.path.getsize(output_path) >= 2048:
        return True

    xtile, ytile = latlon_to_tile(lat, lon, zoom)
    
    # Fetch 2x2 grid around center tile
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
    return os.path.getsize(output_path) >= 2048

def clean_corrupt_thumbnails():
    if not os.path.exists(THUMBNAILS_DIR):
        return
    removed = 0
    for fname in os.listdir(THUMBNAILS_DIR):
        if fname.endswith(".png"):
            fpath = os.path.join(THUMBNAILS_DIR, fname)
            if os.path.getsize(fpath) < 2048:
                try:
                    os.remove(fpath)
                    removed += 1
                except Exception:
                    pass
    print(f"[CLEANUP] Removed {removed} corrupt/blank placeholder PNG files (<2KB).")

def main():
    print("Starting Tier 1 Precomputed Satellite Thumbnail Generator (Robust Backoff & Bounds Check)...")
    clean_corrupt_thumbnails()
    
    grid_path = os.path.join(PREDICTIONS_DIR, "prospectivity_grid.csv")
    occ_path = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")
    
    success_count = 0
    fail_count = 0
    
    if os.path.exists(grid_path):
        df_grid = pd.read_csv(grid_path)
        print(f"Processing {len(df_grid)} prospectivity grid cells...")
        for idx, row in df_grid.iterrows():
            zone_id = row.get("grid_id", f"GRID_{idx+1:04d}")
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            out_file = os.path.join(THUMBNAILS_DIR, f"{zone_id}.png")
            ok = generate_thumbnail(lat, lon, out_file)
            if ok:
                success_count += 1
            else:
                fail_count += 1
            if (idx + 1) % 50 == 0:
                print(f"  Processed {idx+1}/{len(df_grid)} grid cells...")
                
    if os.path.exists(occ_path):
        df_occ = pd.read_csv(occ_path)
        print(f"Processing {len(df_occ)} manganese deposit occurrence points...")
        for idx, row in df_occ.iterrows():
            occ_id = str(row.get("occurrence_id", f"OCC_{idx+1:03d}"))
            lat = float(row["latitude"])
            lon = float(row["longitude"])
            out_file = os.path.join(THUMBNAILS_DIR, f"{occ_id}.png")
            generate_thumbnail(lat, lon, out_file)
            
    print(f"Finished precomputing thumbnails in '{THUMBNAILS_DIR}'. Success: {success_count}, Fallbacks: {fail_count}")

if __name__ == "__main__":
    main()
