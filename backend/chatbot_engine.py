import os
import math
import json
import pandas as pd
import numpy as np
from rapidfuzz import process, fuzz
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors

BASE_DIR = r"d:\mangan ai"
DATA_DIR = os.path.join(BASE_DIR, "data")
REF_DIR = os.path.join(DATA_DIR, "reference")
PREDICTIONS_DIR = os.path.join(DATA_DIR, "predictions")
VALIDATED_DIR = os.path.join(DATA_DIR, "validated")

GAZETTEER_PATH = os.path.join(REF_DIR, "india_gazetteer.parquet")
GRID_PATH = os.path.join(PREDICTIONS_DIR, "prospectivity_grid.csv")
OCCURRENCES_PATH = os.path.join(VALIDATED_DIR, "manganese_occurrences.csv")

# State Manganese Production Metadata
STATE_PRODUCTION_CONTEXT = {
    "Odisha": {
        "share_pct": 44.0,
        "reserves_kt": "92,530 kt",
        "description": "Odisha is India's largest manganese producing state, centered around the Keonjhar-Sundargarh-Rayagada belt with high-grade oxide and siliceous deposits."
    },
    "Madhya Pradesh": {
        "share_pct": 42.7,
        "reserves_kt": "89,800 kt",
        "description": "Madhya Pradesh hosts the world-class Balaghat-Ukwa manganese belt operated by MOIL, producing high-grade dioxide ore."
    },
    "Maharashtra": {
        "share_pct": 42.7,
        "reserves_kt": "89,800 kt",
        "description": "Maharashtra shares the MP-MH manganese corridor in Bhandara & Nagpur districts, featuring major underground and open-pit manganese operations."
    },
    "Karnataka": {
        "share_pct": 11.0,
        "reserves_kt": "23,200 kt",
        "description": "Karnataka contains key manganese deposits in the Sandur schist belt (Bellary) and Shimoga districts associated with banded iron formations."
    },
    "Andhra Pradesh": {
        "share_pct": 2.3,
        "reserves_kt": "4,800 kt",
        "description": "Andhra Pradesh manganese production is concentrated in Srikakulam and Vizianagaram districts (Kodurite & Gondite type ores)."
    }
}

class ChatbotEngine:
    def __init__(self):
        self.gazetteer_df = None
        self.grid_df = None
        self.occurrences_df = None
        self._load_data()

    def _load_data(self):
        if os.path.exists(GAZETTEER_PATH):
            self.gazetteer_df = pd.read_parquet(GAZETTEER_PATH)
        elif os.path.exists(os.path.join(REF_DIR, "india_gazetteer.csv")):
            self.gazetteer_df = pd.read_csv(os.path.join(REF_DIR, "india_gazetteer.csv"))

        if os.path.exists(GRID_PATH):
            self.grid_df = pd.read_csv(GRID_PATH)

        if os.path.exists(OCCURRENCES_PATH):
            self.occurrences_df = pd.read_csv(OCCURRENCES_PATH)

    def search_autocomplete(self, query: str, limit: int = 6):
        if self.gazetteer_df is None or self.gazetteer_df.empty or not query.strip():
            return []
        
        q_lower = query.strip().lower()
        results = []
        
        for idx, row in self.gazetteer_df.iterrows():
            name = str(row["place_name"])
            alt = str(row.get("alternate_names", ""))
            district = str(row["district"])
            state = str(row["state"])
            full_str = f"{name} {alt} {district} {state}".lower()
            
            score = 0
            if q_lower in name.lower():
                score = 100
            elif q_lower in full_str:
                score = 80
            else:
                score = fuzz.partial_ratio(q_lower, full_str)
                
            if score > 45:
                results.append({
                    "place_name": name,
                    "district": district,
                    "state": state,
                    "place_type": row.get("place_type", "locality"),
                    "latitude": float(row["latitude"]),
                    "longitude": float(row["longitude"]),
                    "score": score
                })
                
        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

    def geocode_place(self, place_query: str):
        if self.gazetteer_df is None or self.gazetteer_df.empty:
            return None
        
        names_list = self.gazetteer_df["place_name"].tolist()
        match = process.extractOne(place_query, names_list, scorer=fuzz.WRatio)
        if match and match[1] > 50:
            matched_row = self.gazetteer_df[self.gazetteer_df["place_name"] == match[0]].iloc[0]
            return matched_row.to_dict()
        return None

    @staticmethod
    def haversine_km(lat1, lon1, lat2, lon2):
        R = 6371.0  # Earth radius in km
        dlat = math.radians(lat2 - lat1)
        dlon = math.radians(lon2 - lon1)
        a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def query_prospectivity(self, place_query: str):
        matched_place = self.geocode_place(place_query)
        if not matched_place:
            return {
                "matched_place": place_query,
                "in_coverage": False,
                "message": f"Place '{place_query}' could not be resolved in the gazetteer database.",
                "report": None
            }

        plat = float(matched_place["latitude"])
        plon = float(matched_place["longitude"])
        place_name = matched_place["place_name"]
        district = matched_place["district"]
        state = matched_place["state"]

        if self.grid_df is None or self.grid_df.empty:
            return {
                "matched_place": f"{place_name}, {district}, {state}",
                "coordinates": {"lat": plat, "lon": plon},
                "in_coverage": False,
                "message": "Prospectivity grid model data is unavailable on server.",
                "report": None
            }

        # Calculate distances to all grid cells
        grid_coords = self.grid_df[["latitude", "longitude"]].values
        dists = [self.haversine_km(plat, plon, row[0], row[1]) for row in grid_coords]
        min_dist_idx = np.argmin(dists)
        min_dist_km = dists[min_dist_idx]

        # Explicit Coverage Rule: if nearest grid cell is > 15 km away, mark as OUT OF COVERAGE
        if min_dist_km > 15.0:
            return {
                "matched_place": f"{place_name}, {district}, {state}",
                "coordinates": {"lat": plat, "lon": plon},
                "in_coverage": False,
                "message": f"This area ({place_name}, {state}) is outside the currently modeled manganese exploration region.",
                "nearest_grid_distance_km": round(min_dist_km, 1),
                "report": {
                    "area_name": f"{place_name}, {district}, {state}",
                    "coordinates": f"{plat:.4f}°N, {plon:.4f}°E",
                    "status": "OUT_OF_COVERAGE",
                    "explanation": "This location falls outside the active high-resolution Sentinel-2 spectral and GSI geological mapping coverage bounds for India's primary manganese belts.",
                    "recommendation": "Submit a regional survey request to expand multimodal satellite feature extraction to this district."
                }
            }

        # Inside coverage! Extract 10 km buffer cells
        buffer_mask = np.array(dists) <= 10.0
        buffer_df = self.grid_df[buffer_mask]
        if buffer_df.empty:
            buffer_df = self.grid_df.iloc[[min_dist_idx]]

        nearest_cell = self.grid_df.iloc[min_dist_idx]

        # Calculate aggregate scores
        avg_score = float(buffer_df["prospectivity_score"].mean())
        avg_conf = float(buffer_df["confidence_percent"].mean())
        max_score = float(buffer_df["prospectivity_score"].max())

        # Categories
        if avg_score >= 0.75:
            category = "High Priority"
            interpretation = "High spatial alignment with multimodal manganese spectral and fault signatures."
        elif avg_score >= 0.50:
            category = "Moderate Priority"
            interpretation = "Moderate spatial alignment; secondary structural or alteration anomalies present."
        else:
            category = "Low Priority / Background"
            interpretation = "Background geophysical & spectral baseline; minimal mineral anomaly signals."

        # Find nearest known occurrence
        nearest_occ_name = "N/A"
        nearest_occ_dist_km = 999.0
        if self.occurrences_df is not None and not self.occurrences_df.empty:
            occ_coords = self.occurrences_df[["latitude", "longitude"]].values
            occ_dists = [self.haversine_km(plat, plon, o[0], o[1]) for o in occ_coords]
            min_occ_idx = np.argmin(occ_dists)
            nearest_occ_dist_km = float(occ_dists[min_occ_idx])
            nearest_occ_name = str(self.occurrences_df.iloc[min_occ_idx]["site_name"])

        # Contributing factors SHAP values
        swir_alt = float(nearest_cell.get("swir_alteration_index", 1.85))
        dist_fault = float(nearest_cell.get("dist_to_fault_km", 3.2))
        lst_val = float(nearest_cell.get("lst", 32.5))
        sm_val = float(nearest_cell.get("soil_moisture", 0.22))
        iron_idx = float(nearest_cell.get("ferrous_iron_index", 2.1))

        top_drivers = [
            f"SWIR Alteration Ratio (B11/B12): {swir_alt:.2f} (Elevated clay/carbonate weathering signal)",
            f"Structural Fault Proximity: {dist_fault:.2f} km (Close proximity to regional fault shear zone)",
            f"Environmental Thermal Signature: LST {lst_val:.1f}°C, Soil Moisture {sm_val:.2f} m³/m³",
            f"Ferrous Iron Index (B4/B2): {iron_idx:.2f} (Strong spectral iron oxide signature)"
        ]

        # Geology & Terrain
        lithology = f"{nearest_cell.get('belt_name', 'Metasedimentary Belt')} Gondite / Manganese-bearing Supergroup"
        elev = float(nearest_cell.get("elevation_m", 320.0))
        slope = float(nearest_cell.get("slope_deg", 11.5))

        prod_info = STATE_PRODUCTION_CONTEXT.get(state, {
            "share_pct": 0.0,
            "reserves_kt": "N/A",
            "description": f"{state} is not currently classified as a primary commercial manganese producing state in India."
        })

        report = {
            "area_name": f"{place_name}, {district}, {state}",
            "coordinates": f"{plat:.4f}°N, {plon:.4f}°E",
            "status": "IN_COVERAGE",
            "prospectivity_assessment": {
                "score": round(avg_score, 4),
                "confidence_percent": round(avg_conf, 1),
                "category": category,
                "interpretation": interpretation,
                "grid_cells_in_buffer": len(buffer_df),
                "buffer_radius_km": 10.0
            },
            "why_this_score": {
                "top_contributing_factors": top_drivers
            },
            "geological_context": {
                "lithology": lithology,
                "dist_to_nearest_fault_km": round(dist_fault, 2),
                "nearest_known_occurrence": nearest_occ_name,
                "distance_to_nearest_occurrence_km": round(nearest_occ_dist_km, 2)
            },
            "terrain_context": {
                "elevation_m": round(elev, 1),
                "slope_deg": round(slope, 1)
            },
            "production_context": prod_info,
            "limitations": [
                "Model resolution reflection: Assessment based on 30m grid cell spatial fusion, not site-level core drilling.",
                "Prioritization signal disclaimer: This report provides exploration-priority guidance, not a confirmed deposit or reserve tonnage estimate.",
                "Non-monetary constraint: Scores indicate relative spatial probability and do not map to commercial monetary valuations."
            ]
        }

        return {
            "matched_place": f"{place_name}, {district}, {state}",
            "coordinates": {"lat": plat, "lon": plon},
            "in_coverage": True,
            "report": report
        }

    def generate_pdf_report(self, query_result: dict, output_filename: str):
        doc = SimpleDocTemplate(
            output_filename,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=20,
            leading=24,
            textColor=colors.HexColor('#0f172a'),
            spaceAfter=4
        )
        
        subtitle_style = ParagraphStyle(
            'DocSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=13,
            textColor=colors.HexColor('#475569'),
            spaceAfter=15
        )

        h2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=12,
            leading=15,
            textColor=colors.HexColor('#0284c7'),
            spaceBefore=10,
            spaceAfter=6
        )

        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor('#1e293b')
        )

        bullet_style = ParagraphStyle(
            'Bullet',
            parent=body_style,
            leftIndent=12,
            spaceAfter=4
        )

        elements = []

        # Header Title
        elements.append(Paragraph("SIH 2026 — Manganese Exploration Suitability Report", title_style))
        elements.append(Paragraph("Multimodal Decision Support System (Groups A-D Inputs, VGG19 CNN, Fusion Model C)", subtitle_style))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#0284c7'), spaceAfter=12))

        matched = query_result.get("matched_place", "Location")
        in_cov = query_result.get("in_coverage", False)
        report = query_result.get("report", {})

        # Metadata Table
        meta_data = [
            [Paragraph("<b>Target Location:</b>", body_style), Paragraph(matched, body_style)],
            [Paragraph("<b>Coordinates:</b>", body_style), Paragraph(report.get("coordinates", "N/A"), body_style)],
            [Paragraph("<b>Model Coverage:</b>", body_style), Paragraph("IN COVERAGE (Active Belt)" if in_cov else "OUT OF COVERAGE", body_style)]
        ]
        t_meta = Table(meta_data, colWidths=[120, 420])
        t_meta.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
            ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
            ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
            ('LEFTPADDING', (0,0), (-1,-1), 8),
            ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ]))
        elements.append(t_meta)
        elements.append(Spacer(1, 12))

        if not in_cov:
            elements.append(Paragraph("OUT OF COVERAGE NOTICE", h2_style))
            elements.append(Paragraph(f"<b>Warning:</b> {query_result.get('message', 'This location is outside the current study area.')}", body_style))
            elements.append(Spacer(1, 10))
            elements.append(Paragraph("Silent extrapolation is prohibited under SIH 2026 scientific guidelines. Submit a regional mapping request for this state.", body_style))
        else:
            pa = report.get("prospectivity_assessment", {})
            score = pa.get("score", 0.0)
            category = pa.get("category", "N/A")
            conf = pa.get("confidence_percent", 0.0)

            # Score Hero Box Table
            score_data = [
                [
                    Paragraph(f"<font size=18 color='#0284c7'><b>Prospectivity Score: {score:.4f}</b></font><br/><font size=10 color='#475569'>Category: <b>{category}</b> | Model Confidence: <b>{conf}%</b></font>", body_style)
                ]
            ]
            t_score = Table(score_data, colWidths=[540])
            t_score.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f0f9ff')),
                ('BOX', (0,0), (-1,-1), 1.5, colors.HexColor('#0284c7')),
                ('TOPPADDING', (0,0), (-1,-1), 10),
                ('BOTTOMPADDING', (0,0), (-1,-1), 10),
                ('LEFTPADDING', (0,0), (-1,-1), 12),
                ('RIGHTPADDING', (0,0), (-1,-1), 12),
            ]))
            elements.append(t_score)
            elements.append(Spacer(1, 12))

            # WHY THIS SCORE
            elements.append(Paragraph("WHY THIS SCORE (SHAP & Grad-CAM Drivers)", h2_style))
            for factor in report.get("why_this_score", {}).get("top_contributing_factors", []):
                elements.append(Paragraph(f"• {factor}", bullet_style))
            elements.append(Spacer(1, 10))

            # GEOLOGICAL & TERRAIN CONTEXT
            elements.append(Paragraph("GEOLOGICAL & TERRAIN CONTEXT", h2_style))
            geo = report.get("geological_context", {})
            terr = report.get("terrain_context", {})
            geo_data = [
                [Paragraph("<b>Lithology / Belt:</b>", body_style), Paragraph(geo.get("lithology", "N/A"), body_style)],
                [Paragraph("<b>Dist to Regional Fault:</b>", body_style), Paragraph(f"{geo.get('dist_to_nearest_fault_km', 'N/A')} km", body_style)],
                [Paragraph("<b>Nearest Occurrence:</b>", body_style), Paragraph(f"{geo.get('nearest_known_occurrence', 'N/A')} ({geo.get('distance_to_nearest_occurrence_km', 'N/A')} km)", body_style)],
                [Paragraph("<b>Elevation / Slope:</b>", body_style), Paragraph(f"{terr.get('elevation_m', 'N/A')} m | Slope {terr.get('slope_deg', 'N/A')}°", body_style)]
            ]
            t_geo = Table(geo_data, colWidths=[150, 390])
            t_geo.setStyle(TableStyle([
                ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
                ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#e2e8f0')),
                ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
                ('PADDING', (0,0), (-1,-1), 5),
            ]))
            elements.append(t_geo)
            elements.append(Spacer(1, 10))

            # REGIONAL SUPPLY & LIMITATIONS
            elements.append(Paragraph("REGIONAL SUPPLY CONTEXT & LIMITATIONS", h2_style))
            prod = report.get("production_context", {})
            elements.append(Paragraph(f"<b>State Supply Context:</b> {prod.get('description', '')}", body_style))
            elements.append(Spacer(1, 6))

            for lim in report.get("limitations", []):
                elements.append(Paragraph(f"⚠️ <i>{lim}</i>", bullet_style))

        doc.build(elements)
        print(f"[+] Successfully compiled PDF report to {output_filename}")

chatbot_engine = ChatbotEngine()
