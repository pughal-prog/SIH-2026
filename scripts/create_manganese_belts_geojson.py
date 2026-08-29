import os
import json

def create_manganese_belts_geojson():
    bounds_dir = os.path.join("data", "bounds")
    os.makedirs(bounds_dir, exist_ok=True)

    belts = [
        {
            "name": "Odisha Manganese Belt",
            "states": ["Odisha"],
            "districts": ["Keonjhar", "Sundargarh", "Rayagada", "Koraput"],
            "coords": [[[82.5, 18.2], [86.8, 18.2], [86.8, 22.4], [82.5, 22.4], [82.5, 18.2]]]
        },
        {
            "name": "Madhya Pradesh - Maharashtra Manganese Belt",
            "states": ["Madhya Pradesh", "Maharashtra"],
            "districts": ["Balaghat", "Chhindwara", "Nagpur", "Bhandara"],
            "coords": [[[78.5, 20.8], [80.8, 20.8], [80.8, 22.4], [78.5, 22.4], [78.5, 20.8]]]
        },
        {
            "name": "Karnataka Manganese Belt",
            "states": ["Karnataka"],
            "districts": ["Bellary", "Shimoga", "Uttara Kannada"],
            "coords": [[[74.2, 13.5], [77.2, 13.5], [77.2, 16.2], [74.2, 16.2], [74.2, 13.5]]]
        },
        {
            "name": "Andhra Pradesh Manganese Belt",
            "states": ["Andhra Pradesh"],
            "districts": ["Srikakulam", "Vizianagaram"],
            "coords": [[[83.0, 18.0], [84.8, 18.0], [84.8, 19.3], [83.0, 19.3], [83.0, 18.0]]]
        }
    ]

    features = []
    for b in belts:
        features.append({
            "type": "Feature",
            "properties": {
                "name": b["name"],
                "states": ", ".join(b["states"]),
                "districts": ", ".join(b["districts"]),
                "min_lon": b["coords"][0][0][0],
                "max_lon": b["coords"][0][1][0],
                "min_lat": b["coords"][0][0][1],
                "max_lat": b["coords"][0][2][1],
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": b["coords"]
            }
        })

    geojson_data = {
        "type": "FeatureCollection",
        "crs": {
            "type": "name",
            "properties": {"name": "urn:ogc:def:crs:OGC:1.3:CRS84"}
        },
        "features": features
    }

    out_file = os.path.join(bounds_dir, "manganese_belts_india.geojson")
    with open(out_file, "w") as f:
        json.dump(geojson_data, f, indent=2)

    print(f"[+] Saved Manganese Belts GeoJSON ({len(features)} belt polygons) to: {out_file}")

if __name__ == "__main__":
    create_manganese_belts_geojson()
