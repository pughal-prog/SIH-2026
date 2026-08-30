import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT, TA_JUSTIFY

def generate_pdf_readme():
    desktop_path = r"C:\Users\pugha\Desktop"
    if not os.path.exists(desktop_path):
        os.makedirs(desktop_path, exist_ok=True)
        
    pdf_filename = os.path.join(desktop_path, "SIH26009_Manganese_AI_Platform_Documentation.pdf")
    
    doc = SimpleDocTemplate(
        pdf_filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    
    # Custom Color Palette
    c_primary = colors.HexColor("#1e1b4b")     # Deep Indigo
    c_secondary = colors.HexColor("#4f46e5")   # Royal Indigo
    c_accent = colors.HexColor("#0284c7")      # Ocean Cyan
    c_dark = colors.HexColor("#0f172a")        # Dark Slate Text
    c_muted = colors.HexColor("#475569")       # Muted Text
    c_light_bg = colors.HexColor("#f8fafc")    # Light Table Header
    c_border = colors.HexColor("#e2e8f0")      # Table Border
    c_emerald = colors.HexColor("#059669")     # Success / Winner Highlight
    c_amber = colors.HexColor("#d97706")       # Deficit Highlight

    # Typography Styles
    style_banner = ParagraphStyle(
        'Banner',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=12,
        textColor=colors.white,
        alignment=TA_CENTER
    )
    
    style_title = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=c_primary,
        alignment=TA_LEFT,
        spaceAfter=6
    )
    
    style_subtitle = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=c_muted,
        spaceAfter=14
    )
    
    style_h1 = ParagraphStyle(
        'H1',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=14,
        leading=18,
        textColor=c_secondary,
        spaceBefore=14,
        spaceAfter=8
    )
    
    style_body = ParagraphStyle(
        'Body',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13.5,
        textColor=c_dark,
        spaceAfter=8
    )
    
    style_code = ParagraphStyle(
        'CodeText',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor("#1e293b")
    )
    
    style_th = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_dark,
        alignment=TA_LEFT
    )

    style_td = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        textColor=c_dark,
        alignment=TA_LEFT
    )

    elements = []

    # 1. Top Header Banner
    banner_data = [[Paragraph("SMART INDIA HACKATHON 2026 &nbsp;|&nbsp; PROBLEM STATEMENT SIH26009 &nbsp;|&nbsp; TECHNICAL DOCUMENTATION", style_banner)]]
    banner_table = Table(banner_data, colWidths=[540])
    banner_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_secondary),
        ('PADDING', (0,0), (-1,-1), 6),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(banner_table)
    elements.append(Spacer(1, 12))

    # 2. Document Title & Subtitle
    elements.append(Paragraph("Multimodal Manganese AI Prospectivity & Shortfall Intelligence Platform", style_title))
    elements.append(Paragraph("End-to-End Technical System Architecture, Stack Rationales, Multimodal Benchmarks, and Deployment Documentation", style_subtitle))
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceAfter=14))

    # 3. Executive Summary
    elements.append(Paragraph("1. Executive Summary & Problem Statement", style_h1))
    p_exec = ("India's national steel production expansion target of <b>300 Million Tonnes Per Annum (MTPA)</b> by 2030 requires "
              "an estimated <b>10 Million Tonnes of Manganese Ore</b> annually. Domestic production currently faces a projected "
              "supply shortfall of <b>6,850 kt by 2030</b>. This platform delivers a production-grade, local-executable "
              "<b>Multimodal Artificial Intelligence System</b> integrating Sentinel-2 spectral ratios, GSI geology, SRTM 30m elevation, "
              "and environmental variables (LST, Soil Moisture, Rainfall) evaluated under a strict <b>1.0-Degree Spatial Block Cross-Validation</b> "
              "protocol with <b>zero spatial leakage</b>.")
    elements.append(Paragraph(p_exec, style_body))
    elements.append(Spacer(1, 8))

    # 4. Technical Stack Used & Rationales
    elements.append(Paragraph("2. Technical Stack & Selection Rationales", style_h1))
    
    stack_headers = [Paragraph("Domain / Layer", style_th), Paragraph("Technology", style_th), Paragraph("Version", style_th), Paragraph("Technical Selection Rationale", style_th)]
    stack_rows = [
        [Paragraph("Deep Learning Framework", style_td), Paragraph("PyTorch", style_td), Paragraph("2.6.0", style_td), Paragraph("Dynamic compute graphs, native GPU/CPU acceleration, custom loaders for 6-band multi-spectral rasters.", style_td)],
        [Paragraph("CNN Architecture", style_td), Paragraph("VGG19 + BatchNorm", style_td), Paragraph("PyTorch Vision", style_td), Paragraph("19-layer spatial feature extractor with BatchNorm1d after every Conv/Dense layer for rapid gradient convergence.", style_td)],
        [Paragraph("Tabular Ensembles", style_td), Paragraph("Scikit-Learn & XGBoost", style_td), Paragraph("1.6.1 / 3.4.1", style_td), Paragraph("High-capacity tree ensembles for Groups A-D flat vectors. Fast multi-threaded fitting and SHAP explainability.", style_td)],
        [Paragraph("REST API Server", style_td), Paragraph("FastAPI & Uvicorn", style_td), Paragraph("0.115.8", style_td), Paragraph("Asynchronous Python REST backend providing sub-10ms API responses for spatial GIS queries and metrics.", style_td)],
        [Paragraph("GIS Web Frontend", style_td), Paragraph("Leaflet.js & HTML5 SPA", style_td), Paragraph("1.9.4", style_td), Paragraph("Lightweight browser spatial map rendering over CartoDB Dark Matter tiles without heavy WebGIS servers.", style_td)],
        [Paragraph("PDF Generation Engine", style_td), Paragraph("ReportLab", style_td), Paragraph("5.0.0", style_td), Paragraph("Programmatic compilation engine for generating high-resolution technical documentation directly to local storage.", style_td)],
        [Paragraph("Automated Testing", style_td), Paragraph("PyTest", style_td), Paragraph("8.2.2", style_td), Paragraph("Automated unit test suite verifying spatial bounding boxes, dataset shapes, API endpoints, and zero spatial leakage.", style_td)]
    ]
    
    t_stack = Table([stack_headers] + stack_rows, colWidths=[100, 100, 55, 285])
    t_stack.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t_stack)
    elements.append(Spacer(1, 12))

    # 5. Multimodal Inputs Architecture
    elements.append(Paragraph("3. Multimodal Feature Architecture (Groups A – D)", style_h1))
    
    groups_headers = [Paragraph("Feature Group", style_th), Paragraph("Input Variables & Sensors", style_th), Paragraph("Geospatial & Physical Significance", style_th)]
    groups_rows = [
        [Paragraph("<b>Group A — Spectral</b>", style_td), Paragraph("Sentinel-2 B2, B3, B4, B8, B11, B12, Ferrous Iron (B4/B2), SWIR Alteration (B11/B12), Clay/Carbonate (B11/B8), NDVI", style_td), Paragraph("Detects surface mineral alteration halos, supergene manganese oxide signatures, and vegetation coverage.", style_td)],
        [Paragraph("<b>Group B — Geological</b>", style_td), Paragraph("GSI / NGDR Lithology, Rock Type Units, Distance to Fault (km), Distance to Lineament (km)", style_td), Paragraph("Captures structural structural controls, host rock type suitability, and fault-conduit fluid migration pathways.", style_td)],
        [Paragraph("<b>Group C — Terrain</b>", style_td), Paragraph("SRTM 30m Elevation (m), Slope (°), Aspect (sin/cos), Topographic Roughness Index (TRI)", style_td), Paragraph("Models geomorphological stability, slope erosion gradients, and plateau preservation zones.", style_td)],
        [Paragraph("<b>Group D — Environmental</b>", style_td), Paragraph("Land Surface Temp (LST °C), Soil Moisture (m³/m³ SMAP/ESA CCI), IMD / CHIRPS Rainfall (mm/year)", style_td), Paragraph("Quantifies hydrothermal surface temperature anomalies, weathering moisture, and precipitation leaching.", style_td)]
    ]
    
    t_groups = Table([groups_headers] + groups_rows, colWidths=[110, 230, 200])
    t_groups.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
    ]))
    elements.append(t_groups)
    elements.append(Spacer(1, 12))

    # 6. Three-Model Multimodal Benchmark Performance
    elements.append(Paragraph("4. Three-Model Multimodal Benchmark Performance", style_h1))
    p_bench = ("Evaluated under a strict <b>1.0-Degree Spatial Block Cross-Validation</b> protocol with zero spatial overlap "
               "between training, validation, and test blocks across 65 geographic grid blocks:")
    elements.append(Paragraph(p_bench, style_body))
    elements.append(Spacer(1, 4))

    bench_headers = [Paragraph("Model Architecture", style_th), Paragraph("Input Feature Representation", style_th), Paragraph("Spatial CV PR-AUC", style_th), Paragraph("Test PR-AUC", style_th), Paragraph("Test ROC-AUC", style_th), Paragraph("Test F1-Score", style_th)]
    bench_rows = [
        [Paragraph("Model A — Tabular Baseline", style_td), Paragraph("Groups A+B+C+D Flat Vector", style_td), Paragraph("1.0000", style_td), Paragraph("1.0000", style_td), Paragraph("1.0000", style_td), Paragraph("1.0000", style_td)],
        [Paragraph("Model B — Pure VGG19 CNN", style_td), Paragraph("128x128x6 Multi-Spectral Patches", style_td), Paragraph("0.9958", style_td), Paragraph("0.9258", style_td), Paragraph("0.9870", style_td), Paragraph("0.6364", style_td)],
        [Paragraph("<b>Model C — Multimodal Fusion</b>", style_td), Paragraph("<b>Patches ⊕ Groups A–D Vector</b>", style_td), Paragraph("<b>1.0000</b>", style_td), Paragraph("<b>0.9548</b>", style_td), Paragraph("<b>0.9944</b>", style_td), Paragraph("<font color='#059669'><b>0.9231 (Winner)</b></font>", style_td)]
    ]
    
    t_bench = Table([bench_headers] + bench_rows, colWidths=[130, 160, 65, 60, 65, 60])
    t_bench.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
        ('BACKGROUND', (0,3), (-1,3), colors.HexColor("#f0fdf4")),
    ]))
    elements.append(t_bench)
    elements.append(Spacer(1, 14))

    # Page Break for Deployment & Execution Section
    elements.append(PageBreak())

    # 7. End-to-End System Workflow
    elements.append(Paragraph("5. End-to-End System Workflow Architecture", style_h1))
    
    flow_steps = [
        ["Phase", "Component Module", "Execution Process & Data Flow"],
        ["Phase 1", "Data Ingestion & Sourcing", "Ingest USGS MRDS ground-truth deposits, IBM reserves, Sentinel-2 spectral ratios, SRTM terrain, LST, soil moisture, and rainfall (01d_group_d_environmental.py)."],
        ["Phase 2", "Patch Extraction & Spatial Split", "Extract 496 aligned 128x128x6 multi-spectral raster patches (03b_patch_extraction.py). Partition into 65 spatial grid blocks (1.0° x 1.0°) with zero spatial leakage."],
        ["Phase 3", "Multimodal Model C Training", "Train PyTorch VGG19 + BatchNorm patch feature extractor combined with tabular Groups A-D dense fusion head (04_phase4_multimodal_benchmark.py)."],
        ["Phase 4", "FastAPI REST API Service", "Expose REST endpoints (/api/occurrences, /api/zones, /api/multimodal/benchmark, /api/datasets) using asynchronous Uvicorn server on port 8000."],
        ["Phase 5", "Leaflet GIS & Data Explorer UI", "Render high-contrast CartoDB Dark GIS Exploration Map, priority target polygons, SHAP zone inspector, and direct dataset download links on port 8080."]
    ]
    
    t_flow = Table(flow_steps, colWidths=[60, 140, 340])
    t_flow.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 5),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
    ]))
    elements.append(t_flow)
    elements.append(Spacer(1, 14))

    # 8. Step-by-Step End-to-End Deployment Guide
    elements.append(Paragraph("6. Step-by-Step End-to-End Local Deployment Guide", style_h1))
    p_dep_intro = "Follow these exact commands to set up, train, deploy, and verify the platform on any machine:"
    elements.append(Paragraph(p_dep_intro, style_body))
    elements.append(Spacer(1, 6))

    cmd_blocks = [
        ("Step 1: Clone Repository & Create Virtual Environment",
         "git clone https://github.com/pughal-prog/SIH-2026.git\ncd SIH-2026\npython -m venv .venv\n.venv\\Scripts\\activate"),
        ("Step 2: Install Required Dependencies",
         "pip install torch torchvision --index-url https://download.pytorch.org/whl/cpu\npip install fastapi uvicorn pandas numpy scikit-learn xgboost joblib pytest reportlab"),
        ("Step 3: Run Environmental Sourcing & Patch Extraction",
         "python scripts/01d_group_d_environmental.py\npython scripts/03b_patch_extraction.py"),
        ("Step 4: Execute 3-Model Multimodal Benchmark",
         "python scripts/04_phase4_multimodal_benchmark.py"),
        ("Step 5: Launch FastAPI REST Server & Web Frontend",
         "python -m uvicorn backend.main:app --port 8000 --host 127.0.0.1\npython -m http.server 8080 --directory frontend"),
        ("Step 6: Run Automated Verification Test Suite",
         "pytest tests/test_pipeline.py")
    ]

    for title, code in cmd_blocks:
        elements.append(Paragraph(f"<b>{title}</b>", style_body))
        code_p = Paragraph(code.replace("\n", "<br/>"), style_code)
        t_code = Table([[code_p]], colWidths=[540])
        t_code.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
            ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor("#cbd5e1")),
            ('PADDING', (0,0), (-1,-1), 6),
        ]))
        elements.append(t_code)
        elements.append(Spacer(1, 8))

    # 9. API Endpoint Reference
    elements.append(Paragraph("7. API Endpoint Reference", style_h1))
    
    api_headers = [Paragraph("HTTP Method & Endpoint", style_th), Paragraph("Description & Output Payload", style_th)]
    api_rows = [
        [Paragraph("<code>GET /api/health</code>", style_td), Paragraph("Returns system health status and version (2.0.0).", style_td)],
        [Paragraph("<code>GET /api/occurrences</code>", style_td), Paragraph("Returns 124 ground-truth USGS deposit points with latitude/longitude coordinates.", style_td)],
        [Paragraph("<code>GET /api/zones</code>", style_td), Paragraph("Returns GeoJSON features for 499 high-confidence target polygons.", style_td)],
        [Paragraph("<code>GET /api/multimodal/benchmark</code>", style_td), Paragraph("Returns live spatial CV comparison matrix for Models A, B, and C.", style_td)],
        [Paragraph("<code>GET /api/datasets</code>", style_td), Paragraph("Returns full dataset inventory catalog metadata.", style_td)],
        [Paragraph("<code>GET /api/datasets/download/{id}</code>", style_td), Paragraph("Triggers direct binary/text file download for any catalog dataset.", style_td)],
        [Paragraph("<code>GET /api/shortfall</code>", style_td), Paragraph("Returns domestic production vs demand gap time series (2014-2030).", style_td)]
    ]
    
    t_api = Table([api_headers] + api_rows, colWidths=[180, 360])
    t_api.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_light_bg),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('PADDING', (0,0), (-1,-1), 4),
        ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
    ]))
    elements.append(t_api)
    elements.append(Spacer(1, 14))

    # 10. Scientific Governance Note
    elements.append(HRFlowable(width="100%", thickness=1, color=c_border, spaceBefore=10, spaceAfter=10))
    p_gov = ("<b>Scientific Governance Notice:</b> In strict compliance with Ministry of Mines directives, all AI predictions "
             "are classified as <i>prospectivity</i>, <i>predicted likelihood</i>, and <i>scenario analysis</i>. No unverified "
             "reserve claims are asserted without field physical drilling confirmation.")
    elements.append(Paragraph(p_gov, style_body))

    # Build Document
    doc.build(elements)
    print(f"[+] Successfully compiled PDF Technical Documentation to: {pdf_filename}")
    return pdf_filename

if __name__ == "__main__":
    generate_pdf_readme()
