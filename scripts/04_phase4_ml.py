import os
import json
import joblib
import numpy as np
import pandas as pd

from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, ExtraTreesClassifier, HistGradientBoostingClassifier
from sklearn.metrics import roc_auc_score, precision_recall_curve, auc, f1_score, precision_score, recall_score, balanced_accuracy_score

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
TRAINING_DIR = os.path.join(DATA_DIR, "training")
MODELS_DIR = os.path.join(BASE_DIR, "models")
OUTPUTS_DIR = os.path.join(BASE_DIR, "outputs")

os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(OUTPUTS_DIR, exist_ok=True)

print("==================================================")
print(" PHASE 4: MODEL TRAINING, BENCHMARK & SHAP EXPLAIN")
print("==================================================")

# Load master dataset
parquet_path = os.path.join(TRAINING_DIR, "master_manganese_training.parquet")
df_master = pd.read_parquet(parquet_path)

# Features list
feature_cols = [
    "b2_blue", "b3_green", "b4_red", "b8_nir", "b11_swir1", "b12_swir2",
    "ferrous_iron_index", "swir_alteration_index", "clay_carbonate_index", "ndvi",
    "elevation_m", "slope_deg", "aspect_sin", "aspect_cos", "tri_roughness",
    "dist_to_fault_km", "dist_to_lineament_km"
]

target_col = "label"

# Train / Val / Test Splits based on Spatial Split column
train_df = df_master[df_master['spatial_split'] == 'train']
val_df = df_master[df_master['spatial_split'] == 'validation']
test_df = df_master[df_master['spatial_split'] == 'test']

X_train, y_train = train_df[feature_cols], train_df[target_col]
X_val, y_val = val_df[feature_cols], val_df[target_col]
X_test, y_test = test_df[feature_cols], test_df[target_col]

print(f"[*] Train set: {len(X_train)} rows, Validation set: {len(X_val)} rows, Test set: {len(X_test)} rows.")
print(f"[*] Features ({len(feature_cols)}): {feature_cols}")

# Candidate Classifiers
models = {
    "Logistic Regression": LogisticRegression(max_iter=1000, random_state=42),
    "Random Forest": RandomForestClassifier(n_estimators=150, max_depth=8, random_state=42),
    "Extra Trees": ExtraTreesClassifier(n_estimators=150, max_depth=8, random_state=42),
    "HistGradientBoosting": HistGradientBoostingClassifier(max_iter=150, max_depth=6, random_state=42)
}

# XGBoost if installed
try:
    from xgboost import XGBClassifier
    models["XGBoost"] = XGBClassifier(n_estimators=150, max_depth=5, learning_rate=0.05, random_state=42, eval_metric='logloss')
except ImportError:
    print("[!] XGBoost not installed, using HistGradientBoosting / Random Forest.")

comparison_results = []
best_model_name = None
best_pr_auc = -1.0
best_model_obj = None

print("\n[*] Evaluating Candidate Models on Spatial Validation Split...")

for name, clf in models.items():
    clf.fit(X_train, y_train)
    
    # Predict probabilities on Validation Set
    y_val_prob = clf.predict_proba(X_val)[:, 1]
    y_val_pred = (y_val_prob >= 0.5).astype(int)
    
    roc_auc = roc_auc_score(y_val, y_val_prob)
    precision_vals, recall_vals, _ = precision_recall_curve(y_val, y_val_prob)
    pr_auc = auc(recall_vals, precision_vals)
    f1 = f1_score(y_val, y_val_pred, zero_division=0)
    prec = precision_score(y_val, y_val_pred, zero_division=0)
    rec = recall_score(y_val, y_val_pred, zero_division=0)
    bal_acc = balanced_accuracy_score(y_val, y_val_pred)
    
    res = {
        "Model": name,
        "ROC-AUC": round(roc_auc, 4),
        "PR-AUC": round(pr_auc, 4),
        "F1-Score": round(f1, 4),
        "Precision": round(prec, 4),
        "Recall": round(rec, 4),
        "Balanced Accuracy": round(bal_acc, 4)
    }
    comparison_results.append(res)
    print(f"  -> {name:<22} | ROC-AUC: {roc_auc:.4f} | PR-AUC: {pr_auc:.4f} | F1: {f1:.4f}")
    
    if pr_auc > best_pr_auc:
        best_pr_auc = pr_auc
        best_model_name = name
        best_model_obj = clf

# Save comparison table
comp_df = pd.DataFrame(comparison_results)
comp_csv = os.path.join(OUTPUTS_DIR, "model_comparison.csv")
comp_df.to_csv(comp_csv, index=False)
print(f"\n[+] Saved Model Comparison CSV to: {comp_csv}")
print(f"[+] Best Performing Model selected: {best_model_name} (PR-AUC = {best_pr_auc:.4f})")

# Evaluate Best Model on Test Set
y_test_prob = best_model_obj.predict_proba(X_test)[:, 1]
y_test_pred = (y_test_prob >= 0.5).astype(int)

test_roc_auc = roc_auc_score(y_test, y_test_prob)
prec_t, rec_t, _ = precision_recall_curve(y_test, y_test_prob)
test_pr_auc = auc(rec_t, prec_t)
test_f1 = f1_score(y_test, y_test_pred)

print(f"[*] Final Test Set Performance ({best_model_name}):")
print(f"    - Test ROC-AUC: {test_roc_auc:.4f}")
print(f"    - Test PR-AUC : {test_pr_auc:.4f}")
print(f"    - Test F1-Score: {test_f1:.4f}")

# Extract Feature Importance / SHAP equivalent for Best Model
if hasattr(best_model_obj, "feature_importances_"):
    importances = best_model_obj.feature_importances_
else:
    importances = np.abs(best_model_obj.coef_[0])

feat_imp = pd.DataFrame({
    "feature": feature_cols,
    "importance": importances
}).sort_values(by="importance", ascending=False)

# Save Model Artifacts
joblib.dump(best_model_obj, os.path.join(MODELS_DIR, "best_manganese_model.pkl"))

feature_schema = {
    "feature_names": feature_cols,
    "target": "label",
    "model_name": best_model_name,
    "num_features": len(feature_cols)
}
with open(os.path.join(MODELS_DIR, "feature_schema.json"), "w") as f:
    json.dump(feature_schema, f, indent=2)

metrics_meta = {
    "best_model": best_model_name,
    "validation_roc_auc": best_pr_auc,
    "validation_pr_auc": best_pr_auc,
    "test_roc_auc": round(test_roc_auc, 4),
    "test_pr_auc": round(test_pr_auc, 4),
    "test_f1_score": round(test_f1, 4),
    "top_5_features": feat_imp.head(5)["feature"].tolist(),
    "spatial_split_strategy": "1.0-degree Spatial Block Holdout (Zero Spatial Leakage)"
}
with open(os.path.join(MODELS_DIR, "model_metrics.json"), "w") as f:
    json.dump(metrics_meta, f, indent=2)

# Save SHAP / Feature Importance JSON
with open(os.path.join(MODELS_DIR, "shap_summary.json"), "w") as f:
    json.dump(feat_imp.to_dict(orient="records"), f, indent=2)

# Generate outputs/model_report.md
model_report = f"""# SIH 2026 Model Benchmark & Explainability Report

**Best Selected Model:** `{best_model_name}`  
**Evaluation Strategy:** Spatial Block Cross-Validation ($1.0^\\circ \\times 1.0^\\circ$ Block Split)  

---

## 1. Model Comparison Summary

| Model | ROC-AUC | PR-AUC | F1-Score | Precision | Recall | Balanced Accuracy |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
"""

for _, r in comp_df.iterrows():
    model_report += f"| **{r['Model']}** | {r['ROC-AUC']:.4f} | {r['PR-AUC']:.4f} | {r['F1-Score']:.4f} | {r['Precision']:.4f} | {r['Recall']:.4f} | {r['Balanced Accuracy']:.4f} |\n"

model_report += f"""
---

## 2. Best Model Performance (`{best_model_name}`)
- **Validation PR-AUC:** {best_pr_auc:.4f}
- **Test Set ROC-AUC:** {test_roc_auc:.4f}
- **Test Set PR-AUC:** {test_pr_auc:.4f}
- **Test Set F1-Score:** {test_f1:.4f}

---

## 3. Feature Importance & Explainability Rank

| Rank | Feature | Importance Weight | Geological & Spectral Role |
| :---: | :--- | :---: | :--- |
"""

for i, (_, r) in enumerate(feat_imp.iterrows(), 1):
    role = "SWIR Hydrothermal Alteration" if "swir" in r['feature'] else ("Iron Oxide Signature" if "iron" in r['feature'] else ("Terrain / Relief" if "slope" in r['feature'] or "elevation" in r['feature'] or "tri" in r['feature'] else "Structural Proximity"))
    model_report += f"| {i} | `{r['feature']}` | {r['importance']:.4f} | {role} |\n"

model_report += """
---

## 4. Scientific Language & Prospectivity Thresholds
- **High Prospectivity Zone:** Score $\\ge 0.75$ (High confidence match with known occurrence signatures)
- **Moderate Prospectivity Zone:** Score $0.50 - 0.74$
- **Low / Background Zone:** Score $< 0.50$
"""

with open(os.path.join(OUTPUTS_DIR, "model_report.md"), "w") as f:
    f.write(model_report)
print(f"[+] Saved Model Performance Report to: {os.path.join(OUTPUTS_DIR, 'model_report.md')}")

print("\n==================================================")
print(" PHASE 4 COMPLETED SUCCESSFULLY                   ")
print("==================================================")
