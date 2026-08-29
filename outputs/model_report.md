# SIH 2026 Model Benchmark & Explainability Report

**Best Selected Model:** `Random Forest`  
**Evaluation Strategy:** Spatial Block Cross-Validation ($1.0^\circ \times 1.0^\circ$ Block Split)  

---

## 1. Model Comparison Summary

| Model | ROC-AUC | PR-AUC | F1-Score | Precision | Recall | Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 0.9949 | 0.9943 | 0.9565 | 1.0000 | 0.9167 | 0.9583 |
| **Random Forest** | 1.0000 | 1.0000 | 0.9916 | 1.0000 | 0.9833 | 0.9917 |
| **Extra Trees** | 1.0000 | 1.0000 | 0.9831 | 1.0000 | 0.9667 | 0.9833 |
| **HistGradientBoosting** | 1.0000 | 1.0000 | 0.9565 | 1.0000 | 0.9167 | 0.9583 |
| **XGBoost** | 0.9951 | 0.9938 | 0.9655 | 1.0000 | 0.9333 | 0.9667 |

---

## 2. Best Model Performance (`Random Forest`)
- **Validation PR-AUC:** 1.0000
- **Test Set ROC-AUC:** 1.0000
- **Test Set PR-AUC:** 1.0000
- **Test Set F1-Score:** 0.9231

---

## 3. Feature Importance & Explainability Rank

| Rank | Feature | Importance Weight | Geological & Spectral Role |
| :---: | :--- | :---: | :--- |
| 1 | `clay_carbonate_index` | 0.2541 | Structural Proximity |
| 2 | `b11_swir1` | 0.1398 | SWIR Hydrothermal Alteration |
| 3 | `b2_blue` | 0.1150 | Structural Proximity |
| 4 | `slope_deg` | 0.1128 | Terrain / Relief |
| 5 | `dist_to_fault_km` | 0.0908 | Structural Proximity |
| 6 | `dist_to_lineament_km` | 0.0876 | Structural Proximity |
| 7 | `tri_roughness` | 0.0524 | Terrain / Relief |
| 8 | `b12_swir2` | 0.0436 | SWIR Hydrothermal Alteration |
| 9 | `b3_green` | 0.0368 | Structural Proximity |
| 10 | `b8_nir` | 0.0212 | Structural Proximity |
| 11 | `b4_red` | 0.0134 | Structural Proximity |
| 12 | `elevation_m` | 0.0102 | Terrain / Relief |
| 13 | `ferrous_iron_index` | 0.0071 | Iron Oxide Signature |
| 14 | `swir_alteration_index` | 0.0052 | SWIR Hydrothermal Alteration |
| 15 | `aspect_cos` | 0.0042 | Structural Proximity |
| 16 | `aspect_sin` | 0.0032 | Structural Proximity |
| 17 | `ndvi` | 0.0026 | Structural Proximity |

---

## 4. Scientific Language & Prospectivity Thresholds
- **High Prospectivity Zone:** Score $\ge 0.75$ (High confidence match with known occurrence signatures)
- **Moderate Prospectivity Zone:** Score $0.50 - 0.74$
- **Low / Background Zone:** Score $< 0.50$
