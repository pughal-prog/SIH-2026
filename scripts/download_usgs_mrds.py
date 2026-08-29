import os
import pandas as pd

raw_dir = os.path.join("data", "raw", "usgs_mrds")
proc_dir = os.path.join("data", "processed")

mrds_file = os.path.join(raw_dir, "MRDS.txt")
comm_file = os.path.join(raw_dir, "Commodity.txt")
place_file = os.path.join(raw_dir, "Place.txt")

print("=== Loading MRDS Tables ===")
mrds_df = pd.read_csv(mrds_file, sep='\t', low_memory=False, on_bad_lines='skip')
comm_df = pd.read_csv(comm_file, sep='\t', low_memory=False, on_bad_lines='skip')
place_df = pd.read_csv(place_file, sep='\t', low_memory=False, on_bad_lines='skip')

print(f"[*] MRDS: {len(mrds_df)} rows, Commodity: {len(comm_df)} rows, Place: {len(place_df)} rows.")

# Filter Commodity for manganese (commod or code)
mn_comm = comm_df[
    comm_df['commod'].astype(str).str.contains("manganese|mn", case=False, na=False) |
    (comm_df['code'].astype(str).str.upper() == 'MN')
]
print(f"[+] Found {len(mn_comm)} Manganese commodity records.")

# Merge Commodity with MRDS site data
merged_df = pd.merge(mrds_df, mn_comm, on='dep_id', how='inner')
print(f"[+] Merged Manganese deposit records count: {len(merged_df)}")

# Merge with Place data
full_df = pd.merge(merged_df, place_df, on='dep_id', how='left')

# Spatial Filter for India (Lat: 6 to 36, Lon: 68 to 97)
india_mask = (
    (full_df['latitude'] >= 6.0) & (full_df['latitude'] <= 36.0) &
    (full_df['longitude'] >= 68.0) & (full_df['longitude'] <= 97.0)
)
india_df = full_df[india_mask].copy()

print(f"[+] India Manganese deposit records count (spatial query): {len(india_df)}")
if len(india_df) > 0:
    print(india_df[['dep_id', 'name', 'latitude', 'longitude', 'commod']].head(10))

# Clean & export datasets
global_csv = os.path.join(proc_dir, "usgs_mrds_manganese_global.csv")
india_csv = os.path.join(proc_dir, "usgs_mrds_manganese_india.csv")

full_df.to_csv(global_csv, index=False)
india_df.to_csv(india_csv, index=False)

print(f"[+] Saved Global Manganese MRDS dataset ({len(full_df)} records) to: {global_csv}")
print(f"[+] Saved India Manganese MRDS dataset ({len(india_df)} records) to: {india_csv}")
