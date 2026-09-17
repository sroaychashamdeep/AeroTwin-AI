import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_path="AeroTwin_AI_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette: Deep Aerospace / Cyberpunk Glassmorphic Theme
    DARK_BG = RGBColor(10, 15, 29)         # #0a0f1d
    CARD_BG = RGBColor(18, 26, 47)         # #121a2f
    CARD_BORDER = RGBColor(30, 48, 80)     # #1e3050
    CYAN_ACCENT = RGBColor(0, 229, 255)    # #00e5ff
    BLUE_ACCENT = RGBColor(59, 130, 246)   # #3b82f6
    TEXT_WHITE = RGBColor(248, 250, 252)   # #f8fafc
    TEXT_MUTED = RGBColor(148, 163, 184)   # #94a3b8
    GREEN_ACCENT = RGBColor(34, 197, 94)   # #22c55e
    AMBER_ACCENT = RGBColor(245, 158, 11)  # #f59e0b

    def apply_bg(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = DARK_BG
        bg.line.fill.background()
        return bg

    def add_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=CARD_BG):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
        return shape

    def add_header(slide, title, category="AEROTWIN AI · DEFENCE & AEROSPACE INTELLIGENCE"):
        # Category Tag
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.45), Inches(11.5), Inches(0.4))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.font.size = Pt(10)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        p.font.name = "Arial"

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.8), Inches(11.5), Inches(0.8))
        tf = title_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(24)
        p.font.bold = True
        p.font.color.rgb = TEXT_WHITE
        p.font.name = "Arial"

    blank_layout = prs.slide_layouts[6]

    # ==========================================
    # SLIDE 1: TITLE / COVER SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    apply_bg(s1)

    # Main Card
    add_card(s1, 1.2, 1.0, 10.933, 5.5, border_color=CYAN_ACCENT)

    tb = s1.shapes.add_textbox(Inches(1.8), Inches(1.5), Inches(9.7), Inches(4.5))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "SMART INDIA HACKATHON · AEROSPACE & DEFENCE TRACK"
    p0.font.size = Pt(13)
    p0.font.bold = True
    p0.font.color.rgb = CYAN_ACCENT
    p0.space_after = Pt(14)

    p1 = tf.add_paragraph()
    p1.text = "AEROTWIN AI"
    p1.font.size = Pt(44)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_after = Pt(10)

    p2 = tf.add_paragraph()
    p2.text = "Autonomous Real-Time Digital Twin, Predictive Health Management (PHM) & Mission Reliability System for MALE UAV Piston Powerplants"
    p2.font.size = Pt(16)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.space_after = Pt(30)

    p3 = tf.add_paragraph()
    p3.text = "Target Platform: Rotax 914 / 915 iS Turbocharged Aero Piston Engines\nDeployment: TAPAS-BH-201, Hermes 450, Heron TP Class MALE UAVs"
    p3.font.size = Pt(12)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_after = Pt(20)

    p4 = tf.add_paragraph()
    p4.text = "Predict  •  Simulate  •  Explain  •  Optimize  •  Prevent"
    p4.font.size = Pt(14)
    p4.font.bold = True
    p4.font.color.rgb = GREEN_ACCENT

    # ==========================================
    # SLIDE 2: THE PROBLEM STATEMENT & CHALLENGE
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    apply_bg(s2)
    add_header(s2, "Problem Statement: Operational Vulnerabilities in MALE UAVs")

    cards2 = [
        ("Catastrophic Mid-Flight Failures", "MALE UAVs conduct 12-24 hr persistent ISR missions. Unanticipated turbocharger or fuel injector degradation results in mission aborts, forced ditching, or airframe loss.", AMBER_ACCENT),
        ("Blind Sensor Telemetry", "Raw sensor telemetry is corrupted by noise, atmospheric density fluctuations (FL150+), and sensor drift, confusing conventional threshold-based alarms.", BLUE_ACCENT),
        ("Lack of Physics-AI Fusion", "Pure AI models act as 'black boxes' without aerospace domain awareness, while traditional physics models cannot adapt to real-time wear and emergent multi-fault dynamics.", CYAN_ACCENT),
        ("Unquantified Mission Risk", "Operators lack predictive failure horizons: 'Can this damaged engine complete the remaining 4 hours of the reconnaissance orbit?'", GREEN_ACCENT)
    ]

    for i, (title, desc, color) in enumerate(cards2):
        col = i % 2
        row = i // 2
        x = 0.8 + col * 5.9
        y = 1.8 + row * 2.6
        add_card(s2, x, y, 5.6, 2.3, border_color=color)

        tb = s2.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(5.0), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 3: SYSTEM ARCHITECTURE & 3-TIER ENGINE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    apply_bg(s3)
    add_header(s3, "Architecture: Closed-Loop Aero Engine Intelligence")

    tiers = [
        ("TIER 1: AI MICROSERVICE", "Python 3.13 / FastAPI / PyTorch", [
            "Physics-informed reduced-order engine simulator",
            "Extended Kalman Filter (EKF) sensor fusion",
            "Deep Autoencoder + Isolation Forest anomaly detection",
            "Bi-GRU 10-class temporal fault classifier (98.2% acc)",
            "Physics-guided RUL engine with 95% Confidence Intervals",
            "Self-attention Lightweight Transformer diagnostic model"
        ], CYAN_ACCENT),
        ("TIER 2: MISSION GATEWAY", "Node.js / Express / Socket.IO", [
            "Sub-second real-time telemetry broadcaster (1Hz)",
            "Deterministic maintenance digital thread service",
            "Grok-2 AI Copilot proxy with aerospace SOP guardrails",
            "Dual-layer storage: PostgreSQL + Embedded Persistence",
            "Predictive alert storm suppression engine",
            "Immutable flight and diagnostic audit trails"
        ], BLUE_ACCENT),
        ("TIER 3: GROUND STATION GCS", "React 18 / Three.js / Tailwind", [
            "3D UAV Digital Twin with dynamic heat flux & animations",
            "Interactive directed Causal Graph root-cause inspector",
            "Multi-modal operations: Operator, Engineer, Maintenance, Copilot",
            "Counterfactual 'What-If' flight dynamics simulator",
            "Universal action modals: [WHY?], [WHAT IF?], [ACTION]",
            "Comprehensive 14-page military-grade tactical interface"
        ], GREEN_ACCENT)
    ]

    for i, (title, sub, bullets, color) in enumerate(tiers):
        x = 0.8 + i * 3.95
        add_card(s3, x, 1.8, 3.8, 5.2, border_color=color)

        tb = s3.shapes.add_textbox(Inches(x + 0.25), Inches(1.95), Inches(3.3), Inches(4.9))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(2)

        p_sub = tf.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(12)

        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "• " + b
            pb.font.size = Pt(11)
            pb.font.color.rgb = TEXT_WHITE
            pb.space_after = Pt(6)

    # ==========================================
    # SLIDE 4: THE 11-STEP CLOSED LOOP INTELLIGENCE
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    apply_bg(s4)
    add_header(s4, "Closed-Loop Paradigm: SENSE to LEARN Workflow")

    loop_steps = [
        ("1. SENSE", "14-channel high-rate telemetry ingestion (RPM, CHT, EGT, MAP, Fuel Flow)."),
        ("2. FUSE", "Kalman Filter removes sensor noise and isolates real-time residuals."),
        ("3. UNDERSTAND", "Thermodynamic physics twin calculates baseline nominal expected state."),
        ("4. DETECT", "Isolation Forest & Deep Autoencoder detect subtle multi-signal drifts."),
        ("5. DIAGNOSE", "Bi-GRU + Transformer classify exact failure mode (10 discrete classes)."),
        ("6. PREDICT", "RUL estimation engine computes Remaining Useful Life with 95% CI bands."),
        ("7. EXPLAIN", "XAI engine calculates Shapley feature contributions and plain-English narratives."),
        ("8. SIMULATE", "Counterfactual simulator projects degraded trajectories under weather & altitude."),
        ("9. OPTIMIZE", "Evaluates alternative throttle and altitude profiles for mission survival."),
        ("10. RECOMMEND", "Prescriptive maintenance directives and structured work orders generated."),
        ("11. LEARN", "Drift detection monitors model decay and triggers retrain gating.")
    ]

    for i, (title, desc) in enumerate(loop_steps):
        row = i // 4
        col = i % 4
        x = 0.8 + col * 2.95
        y = 1.8 + row * 1.7
        w = 2.8
        h = 1.5

        add_card(s4, x, y, w, h, border_color=CARD_BORDER)
        tb = s4.shapes.add_textbox(Inches(x + 0.15), Inches(y + 0.15), Inches(w - 0.3), Inches(h - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = RGBColor(226, 232, 240)

    # ==========================================
    # SLIDE 5: 3D DIGITAL TWIN & REAL-TIME GCS
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    apply_bg(s5)
    add_header(s5, "Immersive 3D Digital Twin & Ground Control Station")

    features = [
        ("High-Fidelity 3D Airframe", "WebGL / Three.js 3D rendering of TAPAS MALE-201 UAV with physical prop rotation coupled to simulated RPM, tactical grid, and flight attitude dynamics.", CYAN_ACCENT),
        ("Dynamic Heat Flux Mapping", "Real-time thermal shader dynamically reflects Cylinder Head Temperature (CHT) and Exhaust Gas Temperature (EGT) heat distribution across engine casing.", AMBER_ACCENT),
        ("Engine Ignition State Machine", "True-to-life electrical sequence: OFF -> STARTING (280 RPM starter cranking with procedural audio) -> RUNNING -> SHUTDOWN.", GREEN_ACCENT),
        ("Takeoff & Landing Dynamics", "Physically responsive altitude climb/descent visual effects, dust particles, runway surface rendering, and dynamic aerodynamic pitch.", BLUE_ACCENT),
        ("Causal Root-Cause Graph", "Interactive directed causality viewer showing 'What changed first?' with millisecond-level delta-t progression and fault propagation paths.", CYAN_ACCENT),
        ("Operational Mode Switcher", "Instant role-based perspective toggles: Operator (tactical), Engineer (telemetry deep-dive), Maintenance (digital thread), Copilot (NLP).", GREEN_ACCENT)
    ]

    for i, (title, desc, color) in enumerate(features):
        col = i % 3
        row = i // 3
        x = 0.8 + col * 3.95
        y = 1.8 + row * 2.6
        add_card(s5, x, y, 3.8, 2.3, border_color=color)

        tb = s5.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.2), Inches(3.3), Inches(1.9))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(14)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(6)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 6: BENCHMARK RESULTS & VERIFICATION
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    apply_bg(s6)
    add_header(s6, "Empirical Validation & Benchmark Results")

    metrics = [
        ("98.2%", "Temporal Fault Accuracy", "Bi-GRU classifier across 10 discrete failure modes"),
        ("0.954", "Anomaly ROC-AUC", "Composite Isolation Forest + PyTorch Autoencoder"),
        ("93.2h", "RUL Prediction MAE", "Mean Absolute Error with 95% confidence intervals"),
        ("38 / 38", "Acceptance Tests Passed", "100% automated end-to-end closed-loop verification")
    ]

    for i, (val, label, sub) in enumerate(metrics):
        x = 0.8 + i * 2.95
        add_card(s6, x, 1.8, 2.8, 1.8, border_color=CYAN_ACCENT)

        tb = s6.shapes.add_textbox(Inches(x + 0.15), Inches(1.9), Inches(2.5), Inches(1.5))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = val
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = CYAN_ACCENT
        p.alignment = PP_ALIGN.CENTER

        p2 = tf.add_paragraph()
        p2.text = label
        p2.font.size = Pt(11)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.alignment = PP_ALIGN.CENTER

        p3 = tf.add_paragraph()
        p3.text = sub
        p3.font.size = Pt(9)
        p3.font.color.rgb = TEXT_MUTED
        p3.alignment = PP_ALIGN.CENTER

    # Lower comparison table card
    add_card(s6, 0.8, 3.9, 11.7, 3.1, border_color=CARD_BORDER)
    tb_table = s6.shapes.add_textbox(Inches(1.1), Inches(4.1), Inches(11.1), Inches(2.7))
    tf_table = tb_table.text_frame
    tf_table.word_wrap = True

    p = tf_table.paragraphs[0]
    p.text = "SYSTEM VALIDATION ACROSS SIMULATED FLIGHT REGIMES"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = GREEN_ACCENT
    p.space_after = Pt(10)

    rows = [
        "• Test Suite 1: Full Physics Engine Nominal Cruise Envelope (CHT 140-165°C, EGT 780-820°C, 4700-5000 RPM) — PASSED",
        "• Test Suite 2: Multi-Fault Injection (Injector Clogging, Spark Misfire, Oil Pressure Decay) — PASSED",
        "• Test Suite 3: Probabilistic RUL Ensemble with 10th, 50th, 90th percentile hazard contraction — PASSED",
        "• Test Suite 4: XAI Shapley Feature Attribution & Root Cause Temporal Sequence Identification — PASSED",
        "• Test Suite 5: Computer Vision Borescope Defect Detection (Thermal Oxidation & Localized Blistering) — PASSED"
    ]
    for r in rows:
        pr = tf_table.add_paragraph()
        pr.text = r
        pr.font.size = Pt(11)
        pr.font.color.rgb = RGBColor(226, 232, 240)
        pr.space_after = Pt(5)

    # ==========================================
    # SLIDE 7: GROK COPILOT & DIGITAL THREAD
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    apply_bg(s7)
    add_header(s7, "Aerospace Decision Support: Copilot & Digital Thread")

    cards7 = [
        ("Aerospace SOP-Grounded Copilot", "Integrated Grok AI Copilot with 12 deterministic tool calls, query intent classification, and aerospace guardrails. All answers are cited directly from Rotax manuals and AeroTwin Standard Operating Procedures (SOPs).", BLUE_ACCENT),
        ("Prescriptive Maintenance Economics", "Quantifies financial ROI in real-time. For example: Preventive fuel-injector cleaning (₹12,000 INR) vs catastrophic in-flight cylinder failure (₹85,000 INR) with downtime impact modeling.", GREEN_ACCENT),
        ("Automated Work Order Generation", "One-click generation of structured Maintenance Work Orders (e.g. WO-2026-AERO-042) detailing ATA chapters, required toolkits, step-by-step procedures, and urgency horizons.", CYAN_ACCENT),
        ("Fleet Cross-Airframe Intelligence", "Scans entire UAV squadrons to identify correlated fleet-wide degradation patterns, batch component recalls, and preventative maintenance clustering.", AMBER_ACCENT)
    ]

    for i, (title, desc, color) in enumerate(cards7):
        col = i % 2
        row = i // 2
        x = 0.8 + col * 5.9
        y = 1.8 + row * 2.6
        add_card(s7, x, y, 5.6, 2.3, border_color=color)

        tb = s7.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(5.0), Inches(1.8))
        tf = tb.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(16)
        p.font.bold = True
        p.font.color.rgb = color
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(12)
        p2.font.color.rgb = TEXT_MUTED

    # ==========================================
    # SLIDE 8: CONCLUSION & DEPLOYMENT SUMMARY
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    apply_bg(s8)
    add_header(s8, "Deployment Status & Summary")

    add_card(s8, 0.8, 1.8, 11.7, 5.2, border_color=CYAN_ACCENT)

    tb8 = s8.shapes.add_textbox(Inches(1.2), Inches(2.1), Inches(10.9), Inches(4.6))
    tf8 = tb8.text_frame
    tf8.word_wrap = True

    p = tf8.paragraphs[0]
    p.text = "AEROTWIN AI: READY FOR FLIGHT OPERATIONS & EVALUATION"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = CYAN_ACCENT
    p.space_after = Pt(16)

    bullets8 = [
        ("Live Cloud Microservices", "Render multi-service blueprint deployed: FastAPI AI microservice, Express WebSocket gateway, and React GCS."),
        ("Open-Source Codebase", "Version-controlled on GitHub: https://github.com/sroaychashamdeep/AeroTwin-AI with 100% clean build verification."),
        ("Containerized Portability", "One-command Docker Compose deployment ready for air-gapped defence ground stations and forward operating bases."),
        ("Zero Fake Intelligence", "All confidence intervals, RUL degradation curves, root-cause deltas, and mission risk bands are calculated by active physics models and neural networks."),
        ("Mission Impact", "Transforms UAV maintenance from reactive post-failure repairs to proactive, physics-informed, autonomous lifecycle intelligence.")
    ]

    for title, desc in bullets8:
        pb = tf8.add_paragraph()
        pb.text = f"✔  {title}: "
        pb.font.size = Pt(13)
        pb.font.bold = True
        pb.font.color.rgb = GREEN_ACCENT

        # Add inline description
        run = pb.add_run()
        run.text = desc
        run.font.size = Pt(12)
        run.font.bold = False
        run.font.color.rgb = TEXT_WHITE
        pb.space_after = Pt(10)

    prs.save(output_path)
    print(f"[SUCCESS] Presentation generated at: {output_path}")

if __name__ == "__main__":
    build_presentation("d:/SIH/AeroTwin_AI_Presentation.pptx")
