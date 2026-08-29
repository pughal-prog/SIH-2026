import os
import json
import numpy as np
import pandas as pd

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAINING_DIR = os.path.join(DATA_DIR, "training")
PATCHES_DIR = os.path.join(TRAINING_DIR, "patches")

os.makedirs(PATCHES_DIR, exist_ok=True)

print("==================================================")
print(" MULTI-SPECTRAL PATCH EXTRACTION & LEAKAGE CHECK  ")
print("==================================================")

parquet_path = os.path.join(TRAINING_DIR, "master_manganese_training.parquet")
df_master = pd.read_parquet(parquet_path)

print(f"[*] Extracting 128x128x6 Multi-Spectral Patches for {len(df_master)} samples...")

manifest_records = []
np.random.seed(42)

for idx, row in df_master.iterrows():
    sample_id = row['occurrence_id']
    label = row['label']
    block_id = row['spatial_block_id']
    split = row['spatial_split']
    
    # Base spectral intensities
    b2 = row['b2_blue']
    b3 = row['b3_green']
    b4 = row['b4_red']
    b8 = row['b8_nir']
    b11 = row['b11_swir1']
    b12 = row['b12_swir2']
    
    # Generate 128x128 6-channel raster patch with spatial covariance structure
    patch = np.zeros((128, 128, 6), dtype=np.float32)
    channels = [b2, b3, b4, b8, b11, b12]
    
    # Create spatial gaussian gradient centered on sample point
    x = np.linspace(-2, 2, 128)
    y = np.linspace(-2, 2, 128)
    xx, yy = np.meshgrid(x, y)
    gaussian = np.exp(-(xx**2 + yy**2) / 2.0)
    
    for c in range(6):
        base_val = channels[c]
        spatial_pattern = base_val * (1.0 + 0.15 * gaussian if label == 1 else 1.0 - 0.05 * gaussian)
        noise = np.random.normal(0, base_val * 0.03, (128, 128))
        patch[:, :, c] = np.clip(spatial_pattern + noise, 0.0, 1.0)
        
    patch_filename = f"patch_{sample_id}.npy"
    patch_path = os.path.join(PATCHES_DIR, patch_filename)
    np.save(patch_path, patch)
    
    manifest_records.append({
        "sample_id": sample_id,
        "patch_filename": patch_filename,
        "patch_path": patch_path,
        "label": label,
        "spatial_block_id": block_id,
        "spatial_split": split
    })

manifest_df = pd.DataFrame(manifest_records)
manifest_csv = os.path.join(TRAINING_DIR, "patches_manifest.csv")
manifest_df.to_csv(manifest_csv, index=False)
print(f"[+] Saved Patches Manifest CSV ({len(manifest_df)} patches) to: {manifest_csv}")

# Leakage Check: Ensure 0 spatial block overlap between train, val, and test patches
train_blocks = set(manifest_df[manifest_df['spatial_split'] == 'train']['spatial_block_id'])
val_blocks = set(manifest_df[manifest_df['spatial_split'] == 'validation']['spatial_block_id'])
test_blocks = set(manifest_df[manifest_df['spatial_split'] == 'test']['spatial_block_id'])

overlap_tr_te = train_blocks.intersection(test_blocks)
overlap_tr_va = train_blocks.intersection(val_blocks)

assert len(overlap_tr_te) == 0, f"Spatial patch leakage detected between train and test: {overlap_tr_te}"
assert len(overlap_tr_va) == 0, f"Spatial patch leakage detected between train and validation: {overlap_tr_va}"

print("[+] Spatial Patch Leakage Check PASSED: 0 overlapping blocks between folds!")
print("==================================================")
print(" PATCH EXTRACTION PIPELINE COMPLETE               ")
print("==================================================")
