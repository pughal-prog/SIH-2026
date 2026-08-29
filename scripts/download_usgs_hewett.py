import os
import urllib.request
import json
import ssl
import pandas as pd

def download_hewett_dataset():
    out_dir = os.path.join("data", "raw", "usgs_hewett")
    proc_dir = os.path.join("data", "processed")
    os.makedirs(out_dir, exist_ok=True)
    os.makedirs(proc_dir, exist_ok=True)

    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'}

    sb_item_id = "679ba27ed34ea8c1837736c7"
    api_url = f"https://www.sciencebase.gov/catalog/item/{sb_item_id}?format=json"

    print(f"[*] Querying USGS ScienceBase item {sb_item_id}...")
    req = urllib.request.Request(api_url, headers=headers)
    with urllib.request.urlopen(req, context=ctx) as resp:
        item = json.loads(resp.read().decode('utf-8'))

    files = item.get('files', [])
    print(f"[*] Found {len(files)} files in Hewett collection.")

    csv_path = None
    for f in files:
        fname = f.get('name')
        furl = f.get('url')
        dest_path = os.path.join(out_dir, fname)
        print(f"  -> Downloading {fname}...")
        file_req = urllib.request.Request(furl, headers=headers)
        with urllib.request.urlopen(file_req, context=ctx) as fresp, open(dest_path, 'wb') as out_f:
            out_f.write(fresp.read())
        print(f"     Saved ({os.path.getsize(dest_path)} bytes)")
        if fname.endswith(".csv") and "Hewett" in fname:
            csv_path = dest_path

    if csv_path and os.path.exists(csv_path):
        print("\n[*] Processing Hewett Manganese Dataset...")
        df = pd.read_csv(csv_path)
        print(f"    Loaded {len(df)} sample records.")
        print(f"    Columns: {list(df.columns)}")

        # Save processed copy
        proc_csv = os.path.join(proc_dir, "usgs_hewett_manganese_samples.csv")
        df.to_csv(proc_csv, index=False)
        print(f"[+] Saved clean processed copy to: {proc_csv}")
        return df
    else:
        print("[!] CSV file not found in download.")
        return None

if __name__ == "__main__":
    download_hewett_dataset()
