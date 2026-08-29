# ML Training Dataset Quality Report

**Master Dataset Path:** [`data/training/master_manganese_training.parquet`](file:///d:/mangan%20ai/data/training/master_manganese_training.parquet)  
**Total Records:** 496  
**Positive Records ($y=1$):** 124  
**Background Records ($y=0$):** 372 (Class Imbalance Ratio ~ 1:3)  
**Spatial Split Folds:** 70% Train / 15% Validation / 15% Test  

---

## 1. Feature Quality Verification

| Feature Name | Type | Missing Values (%) | Min | Max | Mean | Leakage Risk |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| `b2_blue` | Float64 | 0.0% | 0.0402 | 0.12 | 0.0827 | NONE |
| `b4_red` | Float64 | 0.0% | 0.1214 | 0.2593 | 0.1939 | NONE |
| `b11_swir1` | Float64 | 0.0% | 0.1608 | 0.4186 | 0.2529 | NONE |
| `b12_swir2` | Float64 | 0.0% | 0.12 | 0.2787 | 0.1882 | NONE |
| `ferrous_iron_index` | Float64 | 0.0% | 1.197 | 5.2123 | 2.4851 | NONE |
| `swir_alteration_index` | Float64 | 0.0% | 0.713 | 2.4516 | 1.3878 | NONE |
| `elevation_m` | Float64 | 0.0% | 80.0 | 697.23 | 317.28 | NONE |
| `slope_deg` | Float64 | 0.0% | 0.2 | 23.21 | 6.87 | NONE |
| `tri_roughness` | Float64 | 0.0% | 1.0 | 37.42 | 11.33 | NONE |
| `dist_to_fault_km` | Float64 | 0.0% | 0.1 | 50.0 | 9.89 | NONE |

---

## 2. Spatial Leakage Mitigation Checks
- **Spatial Block Partitioning:** Partitioned into 65 distinct $1.0^\circ \times 1.0^\circ$ geographic blocks.
- **Leakage Status:** **ZERO SPATIAL LEAKAGE**. All samples within a spatial block belong strictly to either Train, Validation, or Test set.

---

## 3. Data Quality Gate Result
- **Result:** **PASSED ALL QUALITY GATES**. Safe to proceed to Model Benchmark Training.
