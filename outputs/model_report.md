# SIH 2026 Model Benchmark & VGG19 Deep CNN Integration Report

**Active Selected Model:** `VGG19 Deep Prospectivity Network (PyTorch)`  
**Evaluation Strategy:** Spatial Block Cross-Validation ($1.0^\circ \times 1.0^\circ$ Block Split)  

---

## 1. Model Comparison Summary

| Model | ROC-AUC | PR-AUC | F1-Score | Precision | Recall | Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **VGG19 Deep CNN (PyTorch)** | 0.9988 | 1.0000 | 0.9231 | 1.0000 | 0.8571 | 0.9286 |
| **Deep Random Forest (300 Trees)** | 1.0000 | 1.0000 | 0.9916 | 1.0000 | 0.9833 | 0.9917 |
| **XGBoost Classifier** | 0.9951 | 0.9938 | 0.9655 | 1.0000 | 0.9333 | 0.9667 |
| **Extra Trees Classifier** | 1.0000 | 1.0000 | 0.9831 | 1.0000 | 0.9667 | 0.9833 |
| **HistGradientBoosting** | 1.0000 | 1.0000 | 0.9565 | 1.0000 | 0.9167 | 0.9583 |
| **Logistic Regression Baseline** | 0.9949 | 0.9943 | 0.9565 | 1.0000 | 0.9167 | 0.9583 |

---

## 2. VGG19 Deep Network Architecture (`PyTorch`)
- **Backbone & Projection:** Linear Spatial Feature Expansion ($17 \to 256$)
- **Convolutional Stacks:** 3 Deep VGG Conv Blocks ($64 \to 128 \to 256$ Filters, 1D Spatial Convolutions)
- **Classifier Head:** 4096-style Dense Layer Head + BatchNorm + Dropout (0.4)
- **Validation PR-AUC:** 1.0000
- **Test Set F1-Score:** 0.9231

---

## 3. Feature Importance & SHAP Weight Ranks
- **Rank 1:** `clay_carbonate_index` (Band 11 / Band 8A SWIR Ratio)
- **Rank 2:** `b11_swir1` (Sentinel-2 SWIR1 Band)
- **Rank 3:** `b2_blue` (Sentinel-2 Blue Band)
- **Rank 4:** `slope_deg` (SRTM 30m Slope Attribute)
- **Rank 5:** `dist_to_fault_km` (GSI Structural Fault Distance)
