"""
ISRO Bhoonidhi Satellite Downloader & Query Helper
Portal: https://bhoonidhi.nrsc.gov.in
Registration: https://uops.nrsc.gov.in/ImgeosUops/FinalImgeosUops/OdapUserRegister.html

Usage:
  python scripts/bhoonidhi_downloader_helper.py --belt "Odisha" --start "2023-01-01" --end "2024-01-01" --sensor "Sentinel-2A"
"""

import os
import json
import argparse

BELTS_BOUNDING_BOXES = {
    "Odisha": {"minx": 82.5, "miny": 18.2, "maxx": 86.8, "maxy": 22.4},
    "MP_MH": {"minx": 78.5, "miny": 20.8, "maxx": 80.8, "maxy": 22.4},
    "Karnataka": {"minx": 74.2, "miny": 13.5, "maxx": 77.2, "maxy": 16.2},
    "AP": {"minx": 83.0, "miny": 18.0, "maxx": 84.8, "maxy": 19.3},
}

def generate_bhoonidhi_cmd(belt_name, start_date, end_date, sensor="Sentinel-2A"):
    bbox = BELTS_BOUNDING_BOXES.get(belt_name)
    if not bbox:
        print(f"[!] Unknown belt: {belt_name}. Valid belts: {list(BELTS_BOUNDING_BOXES.keys())}")
        return None

    cmd = (
        f"bhoonidhi-downloader search "
        f"{bbox['minx']} {bbox['maxx']} {bbox['miny']} {bbox['maxy']} "
        f"{start_date} {end_date} {sensor}"
    )
    print(f"\n=======================================================")
    print(f" ISRO Bhoonidhi Query for {belt_name} Manganese Belt")
    print(f"=======================================================")
    print(f" Bounding Box: Min Lon {bbox['minx']}, Max Lon {bbox['maxx']}, Min Lat {bbox['miny']}, Max Lat {bbox['maxy']}")
    print(f" Date Range  : {start_date} to {end_date}")
    print(f" Sensor      : {sensor}")
    print(f"\n Command to execute in terminal:")
    print(f"   {cmd}")
    print(f"\n Note: Ensure you have registered on https://bhoonidhi.nrsc.gov.in")
    print(f"       and logged in via `bhoonidhi-downloader login`.")
    print(f"=======================================================\n")
    return cmd

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ISRO Bhoonidhi Satellite Query Helper")
    parser.add_argument("--belt", default="Odisha", choices=list(BELTS_BOUNDING_BOXES.keys()), help="Target Manganese Belt")
    parser.add_argument("--start", default="2023-01-01", help="Start date (YYYY-MM-DD)")
    parser.add_argument("--end", default="2024-01-01", help="End date (YYYY-MM-DD)")
    parser.add_argument("--sensor", default="Sentinel-2A", help="Sensor/Satellite type")
    args = parser.parse_args()

    generate_bhoonidhi_cmd(args.belt, args.start, args.end, args.sensor)
