import os
import pandas as pd

raw_dir = os.path.join("data", "raw", "usgs_mrds")
for f in os.listdir(raw_dir):
    if f.endswith('.txt'):
        fp = os.path.join(raw_dir, f)
        try:
            df = pd.read_csv(fp, sep='\t', nrows=2)
            print(f"File: {f} | Columns: {list(df.columns)}")
        except Exception as e:
            print(f"File: {f} Error: {e}")
