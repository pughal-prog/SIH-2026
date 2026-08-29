# Ground Truth Quality & Validation Report

**Dataset Name:** Ground Truth Known Manganese Occurrences (India)  
**Output Files:**  
- CSV: [`data/validated/manganese_occurrences.csv`](file:///d:/mangan%20ai/data/validated/manganese_occurrences.csv)  
**CRS:** `EPSG:4326` (WGS 84 Geographic)  
**Total Valid Points:** 124  

---

## 1. Validation Statistics

| Metric | Count / Value | Status |
| :--- | :---: | :--- |
| **Total Scanned Records** | 138 | - |
| **Valid Coordinates In-Bounds** | 138 | PASSED |
| **Duplicate Coordinates Removed** | 14 | CLEANED |
| **Final Unique Occurrence Points** | 124 | **READY FOR ML** |
| **Coordinate Range Check** | Lat $\in [6^\circ\text{N}, 37^\circ\text{N}]$, Lon $\in [68^\circ\text{E}, 97^\circ\text{E}]$ | PASSED |

---

## 2. Spatial State Distribution

| State / Belt Region | Occurrence Points | Percentage |
| :--- | :---: | :---: |
| **Madhya Pradesh / Maharashtra** | 76 | 61.3% |
| **Other State** | 27 | 21.8% |
| **Odisha** | 12 | 9.7% |
| **Karnataka** | 9 | 7.3% |

---

## 3. Sampling Bias & Clustering Analysis
- **Cluster High Density:** Primary clustering observed in the **Nagpur-Balaghat-Bhandara Belt** (MP/MH) and the **Keonjhar-Sundargarh Belt** (Odisha).
- **Spatial Coverage:** 100% of points fall inside recognized Indian manganese tectonic belts.
- **ML Mitigation Strategy:** Spatial block cross-validation will be used during ML training to prevent spatial autocorrelation bias.
