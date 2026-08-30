import os
import pandas as pd

BASE_DIR = r"d:\mangan ai"
REF_DIR = os.path.join(BASE_DIR, "data", "reference")
os.makedirs(REF_DIR, exist_ok=True)

# Comprehensive Gazetteer Dataset for India (Focusing on Manganese Belts + Key National Reference Places)
GAZETTEER_DATA = [
    # --- ODISHA MANGANESE BELT & STATE ---
    {"place_name": "Keonjhar", "alternate_names": "Kendujhar, Keonjhargarh", "place_type": "city/district_hq", "latitude": 21.6289, "longitude": 85.5817, "state": "Odisha", "district": "Keonjhar", "source": "GeoNames/Census", "source_id": "OD_001"},
    {"place_name": "Joda", "alternate_names": "Joda Mining Circle", "place_type": "town/mining_center", "latitude": 22.0150, "longitude": 85.4320, "state": "Odisha", "district": "Keonjhar", "source": "GeoNames", "source_id": "OD_002"},
    {"place_name": "Barbil", "alternate_names": "Burbil", "place_type": "town/mining_center", "latitude": 22.1167, "longitude": 85.3833, "state": "Odisha", "district": "Keonjhar", "source": "GeoNames", "source_id": "OD_003"},
    {"place_name": "Sundargarh", "alternate_names": "Sundergarh", "place_type": "city/district_hq", "latitude": 22.1200, "longitude": 84.0300, "state": "Odisha", "district": "Sundargarh", "source": "GeoNames", "source_id": "OD_004"},
    {"place_name": "Rourkela", "alternate_names": "Steel City Rourkela", "place_type": "city", "latitude": 22.2604, "longitude": 84.8536, "state": "Odisha", "district": "Sundargarh", "source": "GeoNames", "source_id": "OD_005"},
    {"place_name": "Rayagada", "alternate_names": "Rayagada Town", "place_type": "city/district_hq", "latitude": 19.1717, "longitude": 83.4161, "state": "Odisha", "district": "Rayagada", "source": "GeoNames", "source_id": "OD_006"},
    {"place_name": "Koraput", "alternate_names": "Koraput Town", "place_type": "city/district_hq", "latitude": 18.8135, "longitude": 82.7123, "state": "Odisha", "district": "Koraput", "source": "GeoNames", "source_id": "OD_007"},
    {"place_name": "Bhubaneswar", "alternate_names": "Bhubaneswar Capital", "place_type": "capital/city", "latitude": 20.2961, "longitude": 85.8245, "state": "Odisha", "district": "Khurda", "source": "GeoNames", "source_id": "OD_008"},

    # --- MADHYA PRADESH - MAHARASHTRA BELT ---
    {"place_name": "Balaghat", "alternate_names": "Balaghat City", "place_type": "city/district_hq", "latitude": 21.8042, "longitude": 80.1849, "state": "Madhya Pradesh", "district": "Balaghat", "source": "GeoNames", "source_id": "MP_001"},
    {"place_name": "Bharweli", "alternate_names": "Bharweli Mine", "place_type": "village/mining_center", "latitude": 21.8480, "longitude": 80.2240, "state": "Madhya Pradesh", "district": "Balaghat", "source": "MOIL", "source_id": "MP_002"},
    {"place_name": "Ukwa", "alternate_names": "Ukwa Manganese Mine", "place_type": "village/mining_center", "latitude": 21.9680, "longitude": 80.4780, "state": "Madhya Pradesh", "district": "Balaghat", "source": "MOIL", "source_id": "MP_003"},
    {"place_name": "Katangi", "alternate_names": "Katangi Town", "place_type": "town", "latitude": 21.7800, "longitude": 79.7900, "state": "Madhya Pradesh", "district": "Balaghat", "source": "GeoNames", "source_id": "MP_004"},
    {"place_name": "Chhindwara", "alternate_names": "Chhindwara City", "place_type": "city/district_hq", "latitude": 22.0574, "longitude": 78.9382, "state": "Madhya Pradesh", "district": "Chhindwara", "source": "GeoNames", "source_id": "MP_005"},
    {"place_name": "Sausar", "alternate_names": "Sausar Town", "place_type": "town", "latitude": 21.6450, "longitude": 78.7910, "state": "Madhya Pradesh", "district": "Chhindwara", "source": "GeoNames", "source_id": "MP_006"},

    {"place_name": "Bhandara", "alternate_names": "Bhandara City", "place_type": "city/district_hq", "latitude": 21.1685, "longitude": 79.6521, "state": "Maharashtra", "district": "Bhandara", "source": "GeoNames", "source_id": "MH_001"},
    {"place_name": "Dongri Buzurg", "alternate_names": "Dongri Mine", "place_type": "town/mining_center", "latitude": 21.5300, "longitude": 79.7100, "state": "Maharashtra", "district": "Bhandara", "source": "MOIL", "source_id": "MH_002"},
    {"place_name": "Mansar", "alternate_names": "Mansar Manganese Belt", "place_type": "town/mining_center", "latitude": 21.3960, "longitude": 79.2520, "state": "Maharashtra", "district": "Nagpur", "source": "MOIL", "source_id": "MH_003"},
    {"place_name": "Nagpur", "alternate_names": "Nagpur City", "place_type": "city", "latitude": 21.1458, "longitude": 79.0882, "state": "Maharashtra", "district": "Nagpur", "source": "GeoNames", "source_id": "MH_004"},
    {"place_name": "Tumsar", "alternate_names": "Tumsar Town", "place_type": "town", "latitude": 21.3800, "longitude": 79.7400, "state": "Maharashtra", "district": "Bhandara", "source": "GeoNames", "source_id": "MH_005"},

    # --- KARNATAKA MANGANESE BELT ---
    {"place_name": "Sandur", "alternate_names": "Sandroo", "place_type": "town/mining_center", "latitude": 15.0874, "longitude": 76.5475, "state": "Karnataka", "district": "Bellary", "source": "GeoNames", "source_id": "KA_001"},
    {"place_name": "Bellary", "alternate_names": "Ballari", "place_type": "city/district_hq", "latitude": 15.1394, "longitude": 76.9214, "state": "Karnataka", "district": "Bellary", "source": "GeoNames", "source_id": "KA_002"},
    {"place_name": "Hospet", "alternate_names": "Hosapete", "place_type": "city", "latitude": 15.2689, "longitude": 76.3909, "state": "Karnataka", "district": "Vijayanagara", "source": "GeoNames", "source_id": "KA_003"},
    {"place_name": "Shimoga", "alternate_names": "Shivamogga", "place_type": "city/district_hq", "latitude": 13.9299, "longitude": 75.5681, "state": "Karnataka", "district": "Shimoga", "source": "GeoNames", "source_id": "KA_004"},
    {"place_name": "Kumsi", "alternate_names": "Kumsi Manganese Deposit", "place_type": "village/mining_center", "latitude": 14.0500, "longitude": 75.4000, "state": "Karnataka", "district": "Shimoga", "source": "GeoNames", "source_id": "KA_005"},
    {"place_name": "Uttara Kannada", "alternate_names": "Karwar District", "place_type": "district_hq", "latitude": 14.8000, "longitude": 74.1300, "state": "Karnataka", "district": "Uttara Kannada", "source": "GeoNames", "source_id": "KA_006"},
    {"place_name": "Bengaluru", "alternate_names": "Bangalore", "place_type": "capital/city", "latitude": 12.9716, "longitude": 77.5946, "state": "Karnataka", "district": "Bengaluru Urban", "source": "GeoNames", "source_id": "KA_007"},

    # --- ANDHRA PRADESH MANGANESE BELT ---
    {"place_name": "Vizianagaram", "alternate_names": "Vizianagaram City", "place_type": "city/district_hq", "latitude": 18.1066, "longitude": 83.3956, "state": "Andhra Pradesh", "district": "Vizianagaram", "source": "GeoNames", "source_id": "AP_001"},
    {"place_name": "Garividi", "alternate_names": "Garividi Manganese Belt", "place_type": "town/mining_center", "latitude": 18.2833, "longitude": 83.5333, "state": "Andhra Pradesh", "district": "Vizianagaram", "source": "GeoNames", "source_id": "AP_002"},
    {"place_name": "Cheepurupalli", "alternate_names": "Chipurupalle", "place_type": "town/mining_center", "latitude": 18.3000, "longitude": 83.5667, "state": "Andhra Pradesh", "district": "Vizianagaram", "source": "GeoNames", "source_id": "AP_003"},
    {"place_name": "Srikakulam", "alternate_names": "Chicacole", "place_type": "city/district_hq", "latitude": 18.2969, "longitude": 83.8968, "state": "Andhra Pradesh", "district": "Srikakulam", "source": "GeoNames", "source_id": "AP_004"},
    {"place_name": "Visakhapatnam", "alternate_names": "Vizag", "place_type": "city", "latitude": 17.6868, "longitude": 83.2185, "state": "Andhra Pradesh", "district": "Visakhapatnam", "source": "GeoNames", "source_id": "AP_005"},
    {"place_name": "Vijayawada", "alternate_names": "Bezawada", "place_type": "city", "latitude": 16.5062, "longitude": 80.6480, "state": "Andhra Pradesh", "district": "NTR", "source": "GeoNames", "source_id": "AP_006"},

    # --- OUT OF COVERAGE / UNMODELED REFERENCE REGIONS (FOR BOUNDS VALIDATION) ---
    {"place_name": "Kochi", "alternate_names": "Cochin", "place_type": "city", "latitude": 9.9312, "longitude": 76.2673, "state": "Kerala", "district": "Ernakulam", "source": "GeoNames", "source_id": "KL_001"},
    {"place_name": "Thiruvananthapuram", "alternate_names": "Trivandrum", "place_type": "capital/city", "latitude": 8.5241, "longitude": 76.9366, "state": "Kerala", "district": "Thiruvananthapuram", "source": "GeoNames", "source_id": "KL_002"},
    {"place_name": "Chennai", "alternate_names": "Madras", "place_type": "capital/city", "latitude": 13.0827, "longitude": 80.2707, "state": "Tamil Nadu", "district": "Chennai", "source": "GeoNames", "source_id": "TN_001"},
    {"place_name": "Jaipur", "alternate_names": "Pink City", "place_type": "capital/city", "latitude": 26.9124, "longitude": 75.7873, "state": "Rajasthan", "district": "Jaipur", "source": "GeoNames", "source_id": "RJ_001"},
    {"place_name": "Mumbai", "alternate_names": "Bombay", "place_type": "capital/city", "latitude": 19.0760, "longitude": 72.8777, "state": "Maharashtra", "district": "Mumbai City", "source": "GeoNames", "source_id": "MH_010"},
    {"place_name": "New Delhi", "alternate_names": "Delhi Capital", "place_type": "capital/city", "latitude": 28.6139, "longitude": 77.2090, "state": "Delhi", "district": "New Delhi", "source": "GeoNames", "source_id": "DL_001"},
    {"place_name": "Kolkata", "alternate_names": "Calcutta", "place_type": "capital/city", "latitude": 22.5726, "longitude": 88.3639, "state": "West Bengal", "district": "Kolkata", "source": "GeoNames", "source_id": "WB_001"},
    {"place_name": "Guwahati", "alternate_names": "Gauhati", "place_type": "city", "latitude": 26.1445, "longitude": 91.7362, "state": "Assam", "district": "Kamrup Metropolitan", "source": "GeoNames", "source_id": "AS_001"},
    {"place_name": "Hyderabad", "alternate_names": "Bhagyanagar", "place_type": "capital/city", "latitude": 17.3850, "longitude": 78.4867, "state": "Telangana", "district": "Hyderabad", "source": "GeoNames", "source_id": "TG_001"},
]

def build_gazetteer():
    df = pd.DataFrame(GAZETTEER_DATA)
    output_parquet = os.path.join(REF_DIR, "india_gazetteer.parquet")
    output_csv = os.path.join(REF_DIR, "india_gazetteer.csv")
    df.to_parquet(output_parquet, index=False)
    df.to_csv(output_csv, index=False)
    print(f"[+] Successfully generated India Gazetteer: {len(df)} entries saved to {output_parquet}")

if __name__ == "__main__":
    build_gazetteer()
