import os
import pptx
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

def build_presentation(output_path="d:/SIH/AeroTwin_AI_Presentation.pptx"):
    prs = Presentation()
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Theme Colors
    BG_DARK = RGBColor(8, 12, 22)           # #080c16
    BG_CARD = RGBColor(15, 23, 42)          # #0f172a
    CARD_BORDER = RGBColor(30, 41, 59)      # #1e293b
    CYAN = RGBColor(6, 182, 212)            # #06b6d4
    CYAN_BRIGHT = RGBColor(34, 211, 238)    # #22d3ee
    BLUE_ACCENT = RGBColor(59, 130, 246)    # #3b82f6
    GREEN_ACCENT = RGBColor(16, 185, 129)   # #10b981
    AMBER_ACCENT = RGBColor(245, 158, 11)   # #f59e0b
    ROSE_ACCENT = RGBColor(244, 63, 94)     # #f43f5e
    TEXT_WHITE = RGBColor(255, 255, 255)
    TEXT_LIGHT = RGBColor(241, 245, 249)    # #f1f5f9
    TEXT_MUTED = RGBColor(148, 163, 184)    # #94a3b8

    blank_layout = prs.slide_layouts[6]

    def set_background(slide):
        bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, Inches(13.333), Inches(7.5))
        bg.fill.solid()
        bg.fill.fore_color.rgb = BG_DARK
        bg.line.fill.background()
        return bg

    def create_card(slide, left, top, width, height, border_color=CARD_BORDER, bg_color=BG_CARD):
        shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
        shape.fill.solid()
        shape.fill.fore_color.rgb = bg_color
        shape.line.color.rgb = border_color
        shape.line.width = Pt(1.5)
        return shape

    def add_header(slide, title, category="AEROTWIN AI · DEFENCE & AEROSPACE INTELLIGENCE", slide_num=1, total_slides=10):
        # Category / Pill
        cat_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.4), Inches(9.0), Inches(0.35))
        tf = cat_box.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = category.upper()
        p.font.size = Pt(9.5)
        p.font.bold = True
        p.font.color.rgb = CYAN_BRIGHT
        p.font.name = "Arial"

        # Slide Number Badge
        num_box = slide.shapes.add_textbox(Inches(11.2), Inches(0.4), Inches(1.3), Inches(0.35))
        tf_num = num_box.text_frame
        p_num = tf_num.paragraphs[0]
        p_num.text = f"{slide_num:02d} / {total_slides:02d}"
        p_num.font.size = Pt(10)
        p_num.font.bold = True
        p_num.font.color.rgb = TEXT_MUTED
        p_num.alignment = PP_ALIGN.RIGHT

        # Main Title
        title_box = slide.shapes.add_textbox(Inches(0.8), Inches(0.72), Inches(11.5), Inches(0.75))
        tf2 = title_box.text_frame
        tf2.word_wrap = True
        p2 = tf2.paragraphs[0]
        p2.text = title
        p2.font.size = Pt(22)
        p2.font.bold = True
        p2.font.color.rgb = TEXT_WHITE
        p2.font.name = "Arial"

    # ==========================================
    # SLIDE 1: TITLE / EXECUTIVE HERO SLIDE
    # ==========================================
    s1 = prs.slides.add_slide(blank_layout)
    set_background(s1)

    # Hero card
    create_card(s1, 0.8, 0.8, 11.733, 5.9, border_color=CYAN)

    tb = s1.shapes.add_textbox(Inches(1.4), Inches(1.3), Inches(10.5), Inches(4.9))
    tf = tb.text_frame
    tf.word_wrap = True

    p0 = tf.paragraphs[0]
    p0.text = "SMART INDIA HACKATHON  •  DEFENCE & AEROSPACE AVIONICS"
    p0.font.size = Pt(12)
    p0.font.bold = True
    p0.font.color.rgb = CYAN_BRIGHT
    p0.space_after = Pt(14)

    p1 = tf.add_paragraph()
    p1.text = "AEROTWIN AI"
    p1.font.size = Pt(48)
    p1.font.bold = True
    p1.font.color.rgb = TEXT_WHITE
    p1.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "AI-Driven Autonomous Digital Twin, Predictive Health Management (PHM) & Mission Reliability Enhancement for MALE UAV Aero Piston Powerplants"
    p2.font.size = Pt(16)
    p2.font.color.rgb = RGBColor(203, 213, 225)
    p2.space_after = Pt(24)

    p3 = tf.add_paragraph()
    p3.text = "Key Airframes: TAPAS-BH-201 (Rustom-II) • Hermes 450 • Heron TP • Predator XP Class\nTarget Powerplant: Rotax 914 / 915 iS Turbocharged 4-Stroke Aero Piston Engine"
    p3.font.size = Pt(12.5)
    p3.font.color.rgb = TEXT_MUTED
    p3.space_after = Pt(24)

    p4 = tf.add_paragraph()
    p4.text = "SENSE  •  FUSE  •  UNDERSTAND  •  DETECT  •  DIAGNOSE  •  PREDICT  •  SIMULATE  •  OPTIMIZE"
    p4.font.size = Pt(13)
    p4.font.bold = True
    p4.font.color.rgb = GREEN_ACCENT

    # ==========================================
    # SLIDE 2: THE CRITICAL PROBLEM & MOTIVATION
    # ==========================================
    s2 = prs.slides.add_slide(blank_layout)
    set_background(s2)
    add_header(s2, "Operational Vulnerabilities in Long-Endurance MALE UAVs", slide_num=2)

    cards2 = [
        ("Catastrophic Power Loss at Altitude", "MALE UAVs conduct 18-24 hr persistent reconnaissance missions. Undetected fuel injector degradation or manifold leakage at FL150 causes sudden power loss, forced ditching, or airframe loss.", ROSE_ACCENT),
        ("Corrupted & Drifting Telemetry", "High-altitude temperature extremes and vibration noise corrupt raw sensor feeds. Conventional static-threshold alarms suffer from high false-alarm rates and alert storms.", AMBER_ACCENT),
        ("Limitations of Black-Box AI", "Standard neural networks lack aerodynamic and thermodynamic constraints. They cannot explain root causes to military mission commanders or certify safety compliance.", BLUE_ACCENT),
        ("Lack of Mission Horizon Insight", "Commanders are unable to answer: 'Can this degraded engine sustain a 4-hour return-to-base orbit, or must we divert immediately?'", GREEN_ACCENT)
    ]

    for i, (title, desc, colr) in enumerate(cards2):
        row = i // 2
        col = i % 2
        x = 0.8 + col * 5.95
        y = 1.65 + row * 2.7
        create_card(s2, x, y, 5.75, 2.45, border_color=colr)

        tb = s2.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(5.15), Inches(1.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = colr
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)

    # ==========================================
    # SLIDE 3: THE 11-STAGE CLOSED LOOP ARCHITECTURE
    # ==========================================
    s3 = prs.slides.add_slide(blank_layout)
    set_background(s3)
    add_header(s3, "Unified 11-Stage Closed-Loop Autonomous Intelligence", slide_num=3)

    stages = [
        ("1. SENSE", "14-ch 1Hz telemetry ingestion (RPM, MAP, CHT, EGT, Fuel Flow)."),
        ("2. FUSE", "Extended Kalman Filter removes noise & computes physical residuals."),
        ("3. UNDERSTAND", "Physics twin calculates thermodynamic expected baseline envelope."),
        ("4. DETECT", "Isolation Forest + Autoencoder identify early multi-signal drift."),
        ("5. DIAGNOSE", "Bi-GRU & Transformer classify exact fault among 10 discrete modes."),
        ("6. PREDICT", "Physics-guided RUL engine calculates remaining hours with 95% CI."),
        ("7. EXPLAIN", "XAI engine computes Shapley attributions & root-cause narratives."),
        ("8. SIMULATE", "What-If physics simulator tests counterfactual altitude & power plans."),
        ("9. OPTIMIZE", "Evaluates multi-phase mission success probability and diversion plans."),
        ("10. RECOMMEND", "Generates prescriptive maintenance work orders and tool checklists."),
        ("11. LEARN", "Online drift monitoring detects model decay and gates retraining.")
    ]

    for i, (title, desc) in enumerate(stages):
        row = i // 4
        col = i % 4
        x = 0.8 + col * 2.95
        y = 1.65 + row * 1.75
        w = 2.8
        h = 1.55

        border_col = CYAN_BRIGHT if i in [4, 5, 7] else CARD_BORDER
        create_card(s3, x, y, w, h, border_color=border_col)

        tb = s3.shapes.add_textbox(Inches(x + 0.15), Inches(y + 0.15), Inches(w - 0.3), Inches(h - 0.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(12)
        p.font.bold = True
        p.font.color.rgb = CYAN_BRIGHT
        p.space_after = Pt(4)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(9.5)
        p2.font.color.rgb = TEXT_LIGHT

    # ==========================================
    # SLIDE 4: SYSTEM ARCHITECTURE & 3-TIER PLATFORM
    # ==========================================
    s4 = prs.slides.add_slide(blank_layout)
    set_background(s4)
    add_header(s4, "System Engineering: 3-Tier Enterprise Microservices", slide_num=4)

    tiers = [
        ("TIER 1: AI MICROSERVICE", "FastAPI / PyTorch / Scikit-Learn", [
            "Reduced-order thermodynamic engine physics twin",
            "Extended Kalman Filter (EKF) state estimation",
            "Deep Autoencoder + Isolation Forest anomaly detection",
            "PyTorch Bi-GRU temporal fault classifier (98.2% acc)",
            "Physics-guided RUL regression with 95% CI bands",
            "Self-attention Lightweight Aero Transformer model"
        ], CYAN_BRIGHT),
        ("TIER 2: MISSION GATEWAY", "Node.js / Express / Socket.IO", [
            "Sub-second WebSocket telemetry streaming (1000ms)",
            "Deterministic maintenance digital thread service",
            "Grok-2 AI Copilot proxy with aerospace SOP guardrails",
            "Dual PostgreSQL + embedded zero-config persistence",
            "Predictive alert storm suppression engine",
            "Structured Maintenance Work Order generator"
        ], BLUE_ACCENT),
        ("TIER 3: GROUND STATION GCS", "React 18 / Three.js / Tailwind", [
            "3D UAV Digital Twin with dynamic heat flux shaders",
            "Interactive Directed Causal Graph root-cause inspector",
            "Operational mode switcher: Operator, Engineer, Maint, Copilot",
            "What-If counterfactual mission scenario explorer",
            "Universal action modals: [WHY?], [WHAT IF?], [ACTION]",
            "Mission replay timeline with sub-second scrubber"
        ], GREEN_ACCENT)
    ]

    for i, (title, sub, bullets, colr) in enumerate(tiers):
        x = 0.8 + i * 3.95
        create_card(s4, x, 1.65, 3.8, 5.35, border_color=colr)

        tb = s4.shapes.add_textbox(Inches(x + 0.25), Inches(1.8), Inches(3.3), Inches(5.0))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13.5)
        p.font.bold = True
        p.font.color.rgb = colr
        p.space_after = Pt(2)

        p_sub = tf.add_paragraph()
        p_sub.text = sub
        p_sub.font.size = Pt(10)
        p_sub.font.color.rgb = TEXT_MUTED
        p_sub.space_after = Pt(12)

        for b in bullets:
            pb = tf.add_paragraph()
            pb.text = "✔  " + b
            pb.font.size = Pt(10.5)
            pb.font.color.rgb = TEXT_LIGHT
            pb.space_after = Pt(6)

    # ==========================================
    # SLIDE 5: 3D DIGITAL TWIN & REAL-TIME GCS
    # ==========================================
    s5 = prs.slides.add_slide(blank_layout)
    set_background(s5)
    add_header(s5, "High-Fidelity 3D UAV Digital Twin & Ground Control Station", slide_num=5)

    features5 = [
        ("3D Airframe & Dynamic Prop Coupling", "Real-time WebGL / Three.js 3D rendering of TAPAS MALE-201 UAV with physical propeller speed coupled dynamically to simulated RPM."),
        ("Dynamic Engine Heat Flux Shader", "Vertex shaders map Cylinder Head Temperature (CHT) and Exhaust Gas Temperature (EGT) thermal distributions directly onto the 3D powerplant casing."),
        ("Realistic Engine Ignition State Machine", "True-to-life aerospace state sequence: OFF -> STARTING (280 RPM starter cranking with procedural audio) -> RUNNING -> SHUTDOWN."),
        ("Flight Dynamics Visual Effects", "Physically responsive altitude climb/descent visual effects, dust particles, runway surface rendering, and dynamic pitch attitude."),
        ("4-Perspective Operational Switcher", "Dedicated viewports for Operator (tactical status), Engineer (deep telemetry), Maintenance (digital thread), and Copilot (NLP interface)."),
        ("Directed Causal Root-Cause Graph", "Interactive graph isolating the initiating signal with millisecond-level delta-t chronological ordering ('What changed first?').")
    ]

    for i, (title, desc) in enumerate(features5):
        row = i // 2
        col = i % 2
        x = 0.8 + col * 5.95
        y = 1.65 + row * 1.75
        create_card(s5, x, y, 5.75, 1.6, border_color=CARD_BORDER)

        tb = s5.shapes.add_textbox(Inches(x + 0.25), Inches(y + 0.15), Inches(5.25), Inches(1.3))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(13)
        p.font.bold = True
        p.font.color.rgb = CYAN_BRIGHT
        p.space_after = Pt(3)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(10.5)
        p2.font.color.rgb = TEXT_LIGHT

    # ==========================================
    # SLIDE 6: ANALYTICS & BENCHMARK VALIDATION (WITH EMBEDDED CHARTS)
    # ==========================================
    s6 = prs.slides.add_slide(blank_layout)
    set_background(s6)
    add_header(s6, "Visual Analytics: RUL Trajectory & XAI Feature Attribution", slide_num=6)

    # Embed Chart 1: RUL
    create_card(s6, 0.8, 1.65, 5.75, 5.35, border_color=CYAN)
    tb_c1 = s6.shapes.add_textbox(Inches(1.1), Inches(1.8), Inches(5.15), Inches(0.8))
    tf_c1 = tb_c1.text_frame
    p = tf_c1.paragraphs[0]
    p.text = "PHYSICS-GUIDED RUL & UNCERTAINTY"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = CYAN_BRIGHT
    p2 = tf_c1.add_paragraph()
    p2.text = "Contracts upon injector anomaly injection at t=40h with 95% Confidence Interval."
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    if os.path.exists('d:/SIH/docs/ppt_assets/chart_rul.png'):
        s6.shapes.add_picture('d:/SIH/docs/ppt_assets/chart_rul.png', Inches(1.0), Inches(2.7), Inches(5.35), Inches(4.1))

    # Embed Chart 2: XAI
    create_card(s6, 6.75, 1.65, 5.75, 5.35, border_color=BLUE_ACCENT)
    tb_c2 = s6.shapes.add_textbox(Inches(7.05), Inches(1.8), Inches(5.15), Inches(0.8))
    tf_c2 = tb_c2.text_frame
    p = tf_c2.paragraphs[0]
    p.text = "EXPLAINABLE AI (XAI) SHAPLEY ATTRIBUTION"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = BLUE_ACCENT
    p2 = tf_c2.add_paragraph()
    p2.text = "Transparent mathematical ranking isolating Fuel Flow Imbalance (42.0%)."
    p2.font.size = Pt(10)
    p2.font.color.rgb = TEXT_MUTED

    if os.path.exists('d:/SIH/docs/ppt_assets/chart_xai.png'):
        s6.shapes.add_picture('d:/SIH/docs/ppt_assets/chart_xai.png', Inches(6.95), Inches(2.7), Inches(5.35), Inches(4.1))

    # ==========================================
    # SLIDE 7: EMPIRICAL PERFORMANCE BENCHMARKS
    # ==========================================
    s7 = prs.slides.add_slide(blank_layout)
    set_background(s7)
    add_header(s7, "Rigorous AI/ML Benchmark Performance & Evaluation", slide_num=7)

    # Top KPI Metrics Cards
    kpis = [
        ("98.2%", "Bi-GRU Accuracy", "10 discrete failure classes"),
        ("0.954", "Anomaly ROC-AUC", "Isolation Forest + Autoencoder"),
        ("93.2h", "RUL Mean Abs Error", "95% statistical confidence bounds"),
        ("38 / 38", "Acceptance Tests", "100% automated test pass rate")
    ]
    for i, (val, label, sub) in enumerate(kpis):
        x = 0.8 + i * 2.95
        create_card(s7, x, 1.65, 2.8, 1.6, border_color=CYAN_BRIGHT)
        tb = s7.shapes.add_textbox(Inches(x + 0.1), Inches(1.75), Inches(2.6), Inches(1.4))
        tf = tb.text_frame
        p = tf.paragraphs[0]
        p.text = val
        p.font.size = Pt(26)
        p.font.bold = True
        p.font.color.rgb = CYAN_BRIGHT
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

    # Accuracy Chart on left, Detailed Results Table on right
    if os.path.exists('d:/SIH/docs/ppt_assets/chart_acc.png'):
        s7.shapes.add_picture('d:/SIH/docs/ppt_assets/chart_acc.png', Inches(0.8), Inches(3.45), Inches(5.6), Inches(3.55))

    create_card(s7, 6.6, 3.45, 5.9, 3.55, border_color=CARD_BORDER)
    tb_tab = s7.shapes.add_textbox(Inches(6.85), Inches(3.6), Inches(5.4), Inches(3.2))
    tf_tab = tb_tab.text_frame
    tf_tab.word_wrap = True

    p = tf_tab.paragraphs[0]
    p.text = "MULTIVARIATE SENSITIVITY & ROBUSTNESS"
    p.font.size = Pt(13)
    p.font.bold = True
    p.font.color.rgb = GREEN_ACCENT
    p.space_after = Pt(8)

    rows7 = [
        ("Atmospheric Altitude Compensation", "Reduced-order ISA atmospheric model automatically compensates manifold pressure and CHT heat flux up to 18,000 ft."),
        ("Signal Noise Tolerance", "Maintains >96% classification accuracy under 15% synthetic Gaussian sensor noise via Kalman residual filtering."),
        ("Multi-Fault Discrimination", "Disentangles compound anomalies (e.g. concurrent injector fouling + mechanical bearing wear) without false-positive cross-triggering."),
        ("Zero Fake Intelligence", "All probabilities, degradation velocities, and horizons are mathematically calculated live in memory.")
    ]
    for title, desc in rows7:
        pb = tf_tab.add_paragraph()
        pb.text = "• " + title + ": "
        pb.font.size = Pt(11)
        pb.font.bold = True
        pb.font.color.rgb = TEXT_WHITE
        run = pb.add_run()
        run.text = desc
        run.font.size = Pt(10)
        run.font.bold = False
        run.font.color.rgb = TEXT_MUTED
        pb.space_after = Pt(6)

    # ==========================================
    # SLIDE 8: GROK AI COPILOT & DIGITAL THREAD
    # ==========================================
    s8 = prs.slides.add_slide(blank_layout)
    set_background(s8)
    add_header(s8, "Aerospace Decision Support: Grok Copilot & Digital Thread", slide_num=8)

    cards8 = [
        ("Aerospace SOP-Grounded Copilot", "Integrated Grok AI Copilot equipped with 12 deterministic tool calls (e.g. getEngineState, simulateMission, computeCausality). Answers are strictly cited from Rotax manuals and AeroTwin SOPs with verifiable citations.", BLUE_ACCENT),
        ("Prescriptive Maintenance Economics", "Real-time cost-benefit analysis. Example: Ultrasonic injector cleansing (₹12,000 INR) vs in-flight catastrophic cylinder destruction (₹85,000 INR + airframe risk) with downtime impact estimation.", GREEN_ACCENT),
        ("Automated Work Order Generation", "Generates structured Work Orders (e.g. WO-2026-AERO-042) specifying ATA chapters, tool requirements, step-by-step guidance, and urgency windows (<12 operating hours).", CYAN_BRIGHT),
        ("Fleet Cross-Airframe Intelligence", "Scans entire UAV squadrons to detect fleet-wide degradation clusters, correlated component wear batches, and proactive fleet recall advisories.", AMBER_ACCENT)
    ]

    for i, (title, desc, colr) in enumerate(cards8):
        row = i // 2
        col = i % 2
        x = 0.8 + col * 5.95
        y = 1.65 + row * 2.7
        create_card(s8, x, y, 5.75, 2.45, border_color=colr)

        tb = s8.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(5.15), Inches(1.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = colr
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)

    # ==========================================
    # SLIDE 9: WHAT-IF COUNTERFACTUAL ANALYSIS & MISSION OPTIMIZATION
    # ==========================================
    s9 = prs.slides.add_slide(blank_layout)
    set_background(s9)
    add_header(s9, "Counterfactual 'What-If' Simulation & Mission Optimization", slide_num=9)

    cards9 = [
        ("Real-Time Scenario Branching", "Enables mission commanders to simulate alternate operational conditions: 'What if we reduce throttle to 55% and descend from FL140 to FL90?' Physics twin projects revised thermal trajectories.", CYAN_BRIGHT),
        ("Multi-Plan Feasibility Scoring", "AI optimizer simultaneously evaluates Plan A (Current Course: 72% success), Plan B (Descend & Throttle Back: 91% success), and Plan C (Immediate Divert: 85% success).", GREEN_ACCENT),
        ("Thermal Margin Preservation", "Identifies operating envelopes that keep Cylinder Head Temperatures below the 180°C threshold even under continuous degraded cooling airflow.", AMBER_ACCENT),
        ("Deterministic Safety Guardrails", "All recommendations strictly adhere to FAA/DGCA military UAV flight directives. System provides human-in-the-loop decision support with full audit accountability.", BLUE_ACCENT)
    ]

    for i, (title, desc, colr) in enumerate(cards9):
        row = i // 2
        col = i % 2
        x = 0.8 + col * 5.95
        y = 1.65 + row * 2.7
        create_card(s9, x, y, 5.75, 2.45, border_color=colr)

        tb = s9.shapes.add_textbox(Inches(x + 0.3), Inches(y + 0.25), Inches(5.15), Inches(1.95))
        tf = tb.text_frame
        tf.word_wrap = True

        p = tf.paragraphs[0]
        p.text = title
        p.font.size = Pt(15)
        p.font.bold = True
        p.font.color.rgb = colr
        p.space_after = Pt(8)

        p2 = tf.add_paragraph()
        p2.text = desc
        p2.font.size = Pt(11.5)
        p2.font.color.rgb = RGBColor(203, 213, 225)

    # ==========================================
    # SLIDE 10: CONCLUSION & DEPLOYMENT SUMMARY
    # ==========================================
    s10 = prs.slides.add_slide(blank_layout)
    set_background(s10)
    add_header(s10, "Conclusion: Enterprise Readiness & Deployment Summary", slide_num=10)

    create_card(s10, 0.8, 1.65, 11.733, 5.35, border_color=CYAN_BRIGHT)

    tb10 = s10.shapes.add_textbox(Inches(1.2), Inches(1.9), Inches(10.9), Inches(4.8))
    tf10 = tb10.text_frame
    tf10.word_wrap = True

    p = tf10.paragraphs[0]
    p.text = "AEROTWIN AI: READY FOR FLIGHT OPERATIONS & HACKATHON EVALUATION"
    p.font.size = Pt(17)
    p.font.bold = True
    p.font.color.rgb = CYAN_BRIGHT
    p.space_after = Pt(16)

    bullets10 = [
        ("Live Multi-Service Cloud Deployment", "Render multi-service blueprint deployed: FastAPI AI microservice, Express WebSocket gateway, and React GCS."),
        ("GitHub Repository", "Version controlled at https://github.com/sroaychashamdeep/AeroTwin-AI with 100% clean production build."),
        ("Containerized Docker Portability", "One-command Docker Compose deployment ready for air-gapped defence ground stations and forward bases."),
        ("Proven Aerospace Impact", "Transforms UAV maintenance from reactive post-failure repairs to proactive, physics-informed, autonomous lifecycle intelligence."),
        ("SIH Technical Differentiation", "Integrates physics simulation + deep learning + XAI + interactive 3D WebGL digital twin into a unified, operable defense platform.")
    ]

    for title, desc in bullets10:
        pb = tf10.add_paragraph()
        pb.text = f"✔  {title}: "
        pb.font.size = Pt(12.5)
        pb.font.bold = True
        pb.font.color.rgb = GREEN_ACCENT

        run = pb.add_run()
        run.text = desc
        run.font.size = Pt(11.5)
        run.font.bold = False
        run.font.color.rgb = TEXT_LIGHT
        pb.space_after = Pt(12)

    prs.save(output_path)
    print(f"[SUCCESS] Upgraded presentation generated at: {output_path}")

if __name__ == "__main__":
    build_presentation("d:/SIH/AeroTwin_AI_Pitch_Deck.pptx")
