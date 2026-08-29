"""
Copernicus Data Space - Sentinel-2 Level-2A Surface Reflectance & Mineral Index Helper
Portal: https://dataspace.copernicus.eu

This script provides STAC API queries and spectral index generation for Manganese mineral exploration:
  1. Ferrous Minerals / Iron Oxide Ratio: Band 4 / Band 2 (Red / Blue)
  2. Hydrothermal Alteration Index (SWIR Ratio): Band 11 / Band 12 (B11/B12)
  3. Clay / Carbonate Alteration: Band 11 / Band 8A (SWIR1 / VNIR)
  4. NDVI Vegetation Mask: (Band 8 - Band 4) / (Band 8 + Band 4)
"""

import os
import json
import urllib.request
import ssl

COPERNICUS_STAC_URL = "https://catalogue.dataspace.copernicus.eu/stac/search"

def query_sentinel2_stac(bbox, start_date, end_date, max_cloud=10):
    """
    Queries Copernicus STAC API for Sentinel-2 Level-2A products (S2MSI2A).
    bbox: [min_lon, min_lat, max_lon, max_lat]
    """
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    payload = {
        "collections": ["SENTINEL-2"],
        "bbox": bbox,
        "datetime": f"{start_date}T00:00:00Z/{end_date}T23:59:59Z",
        "query": {
            "eo:cloud_cover": {"lte": max_cloud},
            "productType": {"eq": "S2MSI2A"}
        },
        "limit": 10
    }

    headers = {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    }

    print(f"[*] Querying Copernicus Data Space STAC for bbox={bbox}, clouds <= {max_cloud}%...")
    try:
        req = urllib.request.Request(COPERNICUS_STAC_URL, data=json.dumps(payload).encode('utf-8'), headers=headers)
        with urllib.request.urlopen(req, context=ctx) as resp:
            res = json.loads(resp.read().decode('utf-8'))
            features = res.get('features', [])
            print(f"[+] Found {len(features)} matching Sentinel-2 L2A scenes.")
            for feat in features[:5]:
                props = feat.get('properties', {})
                print(f"  - Scene ID: {feat.get('id')}")
                print(f"    Date: {props.get('datetime')}, Cloud Cover: {props.get('eo:cloud_cover')}%\n")
            return features
    except Exception as e:
        print(f"[!] STAC Query failed: {e}")
        print("  -> Ensure dataspace.copernicus.eu credentials or direct HTTPS fetch.")
        return []

if __name__ == "__main__":
    # Test query for Odisha Manganese Belt
    odisha_bbox = [82.5, 18.2, 86.8, 22.4]
    query_sentinel2_stac(odisha_bbox, "2023-01-01", "2023-12-31", max_cloud=5)
