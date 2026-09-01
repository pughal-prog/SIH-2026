import os
import json

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
PROCESSED_DIR = os.path.join(DATA_DIR, "processed")
os.makedirs(PROCESSED_DIR, exist_ok=True)

protected_areas = [
    {
        "name": "Similipal Tiger Reserve & Keonjhar Dense Forest",
        "category": "Protected Area / Dense Forest",
        "state": "Odisha",
        "clearance_required": "Ministry of Environment, Forest and Climate Change (MoEFCC) Forest Clearance Stage II",
        "coords": [
            [85.70, 21.35],
            [86.50, 21.35],
            [86.50, 22.25],
            [85.70, 22.25],
            [85.70, 21.35]
        ]
    },
    {
        "name": "Kanha-Balaghat Forest Corridor & Reserved Forest",
        "category": "Protected Area / Wildlife Corridor",
        "state": "Madhya Pradesh",
        "clearance_required": "National Board for Wildlife (NBWL) & MoEFCC Forest Clearance",
        "coords": [
            [80.15, 21.80],
            [80.85, 21.80],
            [80.85, 22.45],
            [80.15, 22.45],
            [80.15, 21.80]
        ]
    },
    {
        "name": "Sandur Reserved Forest & Wildlife Sanctuary",
        "category": "Reserved Forest",
        "state": "Karnataka",
        "clearance_required": "Karnataka State Forest Dept Clearance & Supreme Court CEC Guidelines",
        "coords": [
            [76.35, 14.95],
            [76.85, 14.95],
            [76.85, 15.45],
            [76.35, 15.45],
            [76.35, 14.95]
        ]
    },
    {
        "name": "Eastern Ghats Reserve Forest (Vizianagaram)",
        "category": "Dense Forest Reserve",
        "state": "Andhra Pradesh",
        "clearance_required": "AP Forest Dept Eco-Sensitive Zone Clearance",
        "coords": [
            [83.15, 18.25],
            [83.65, 18.25],
            [83.65, 18.75],
            [83.15, 18.75],
            [83.15, 18.25]
        ]
    }
]

features = []
for idx, pa in enumerate(protected_areas, start=1):
    features.append({
        "type": "Feature",
        "properties": {
            "pa_id": f"PA-{idx:03d}",
            "name": pa["name"],
            "category": pa["category"],
            "state": pa["state"],
            "clearance_required": pa["clearance_required"]
        },
        "geometry": {
            "type": "Polygon",
            "coordinates": [pa["coords"]]
        }
    })

geojson_data = {
    "type": "FeatureCollection",
    "crs": {"type": "name", "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}},
    "features": features
}

output_path = os.path.join(PROCESSED_DIR, "environmental_protected_areas.geojson")
with open(output_path, "w", encoding="utf-8") as f:
    json.dump(geojson_data, f, indent=2)

print(f"[+] Saved {len(features)} Protected Area boundaries to: {output_path}")
