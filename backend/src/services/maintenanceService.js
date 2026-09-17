/**
 * AEROTWIN AI - Maintenance Economics, Digital Thread & Work Order Service
 * Links: Telemetry -> Anomaly -> Fault -> Prediction -> Maintenance -> Inspection -> Resolution
 * Provides configurable cost models and structured aerospace work orders.
 */

class MaintenanceService {
  constructor() {
    this.workOrders = [
      {
        id: "WO-2026-AERO-001",
        engineId: "AERO-ENG-001",
        uavId: "UAV-001",
        title: "Injector Solenoid & Spray Pattern Calibration",
        subsystem: "Fuel System",
        component: "Fuel Injector Nozzle Assembly Cyl 1 & 3",
        severity: "WARNING",
        priority: "P2",
        dueWithinHours: 24.0,
        estimatedDowntimeHours: 2.5,
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        evidence: {
          initiatingSignal: "fuel_flow",
          sensorDelta: "+18% above nominal MAP fuel schedule",
          egtDelta: "+45°C peak exhaust gas temperature",
          modelConsensusAgreement: "89%"
        },
        digitalThread: {
          telemetryOnsetTimestamp: new Date(Date.now() - 3600000 * 2.2).toISOString(),
          anomalyDetector: "Isolation Forest + Autoencoder (Score: 0.68)",
          faultClassifier: "Bi-GRU + Transformer (Injector Abnormality, 84% prob)",
          rulImpactHours: "-38 hours reduction",
          inspectionStep: "Ultrasonic cleaning & bench flow calibration per Rotax MM-73-10",
          resolutionLog: null
        },
        partsRequired: [
          { partNumber: "ROTAX-866-712", name: "Injector O-Ring Kit (Viton)", qty: 4, inStock: true },
          { partNumber: "AERO-FLTR-09", name: "Inline High-Pressure Microfilter (10 micron)", qty: 1, inStock: true }
        ],
        costModel: {
          preventiveCostINR: 12500,
          expectedFailureImpactINR: 85000,
          missionDelayImpactINR: 42000,
          recommendedStrategy: "PREVENTIVE_MAINTENANCE"
        }
      },
      {
        id: "WO-2026-AERO-002",
        engineId: "AERO-ENG-002",
        uavId: "UAV-002",
        title: "Gearbox Dog-Clutch Preload Inspection",
        subsystem: "Mechanical / Propulsion",
        component: "Pusher Propeller Gearbox Coupling",
        severity: "ADVISORY",
        priority: "P3",
        dueWithinHours: 50.0,
        estimatedDowntimeHours: 1.5,
        status: "OPEN",
        createdAt: new Date(Date.now() - 3600000 * 18).toISOString(),
        evidence: {
          initiatingSignal: "vibration",
          sensorDelta: "3.2 g harmonic peak at 2.4x prop shaft frequency",
          modelConsensusAgreement: "92%"
        },
        digitalThread: {
          telemetryOnsetTimestamp: new Date(Date.now() - 3600000 * 20).toISOString(),
          anomalyDetector: "Isolation Forest (Score: 0.42)",
          faultClassifier: "Temporal TCN (Abnormal Vibration, 76% prob)",
          rulImpactHours: "-12 hours reduction",
          inspectionStep: "Dial indicator backlash measurement per SB-2024-11",
          resolutionLog: null
        },
        partsRequired: [
          { partNumber: "ROTAX-945-810", name: "Bellville Spring Pack", qty: 2, inStock: true }
        ],
        costModel: {
          preventiveCostINR: 8500,
          expectedFailureImpactINR: 65000,
          missionDelayImpactINR: 30000,
          recommendedStrategy: "PREVENTIVE_MAINTENANCE"
        }
      }
    ];
  }

  getWorkOrders(filter = {}) {
    if (filter.status) {
      return this.workOrders.filter(w => w.status === filter.status);
    }
    return this.workOrders;
  }

  generateWorkOrderFromIntelligence(intelligenceState) {
    const diag = intelligenceState.diagnosis || {};
    const root = intelligenceState.root_cause || {};
    const rec = intelligenceState.recommendation || {};
    const health = intelligenceState.health || {};
    const rul = intelligenceState.rul || {};

    const faultName = diag.primary_fault || "Unspecified Powerplant Anomaly";
    const orderId = `WO-2026-AERO-${String(this.workOrders.length + 1).padStart(3, '0')}`;

    const newOrder = {
      id: orderId,
      engineId: intelligenceState.engine_id || "AERO-ENG-001",
      uavId: "UAV-001",
      title: `${faultName} Service & Rectification`,
      subsystem: diag.affected_subsystem || "Propulsion",
      component: root.initiating_signal ? `Subsystem Channel: ${root.initiating_signal.toUpperCase()}` : "Powerplant Core",
      severity: rec.priority === "P1" ? "CRITICAL" : (rec.priority === "P2" ? "WARNING" : "ADVISORY"),
      priority: rec.priority || "P2",
      dueWithinHours: rec.priority === "P1" ? 12.0 : (rec.priority === "P2" ? 36.0 : 75.0),
      estimatedDowntimeHours: rec.priority === "P1" ? 4.0 : 2.0,
      status: "OPEN",
      createdAt: new Date().toISOString(),
      evidence: {
        initiatingSignal: root.initiating_signal || "Multi-sensor delta",
        primaryFault: faultName,
        faultProbability: `${Math.round((diag.probability || 0.8) * 100)}%`,
        modelAgreement: `${Math.round((diag.model_agreement || 0.85) * 100)}%`,
        currentOverallHealth: `${health.overall || 85}%`
      },
      digitalThread: {
        telemetryOnsetTimestamp: intelligenceState.timestamp || new Date().toISOString(),
        anomalyDetector: `ChangePoint + Isolation Forest (Score: ${intelligenceState.anomaly?.score || 0.65})`,
        faultClassifier: `Consensus Engine (${faultName})`,
        rulImpactHours: `Current RUL: ${Math.round(rul.expected_hours || 140)}h (P10: ${Math.round(rul.p10 || 110)}h)`,
        inspectionStep: rec.action || "Perform standard visual and electrical diagnostics",
        resolutionLog: null
      },
      partsRequired: this._suggestParts(faultName),
      costModel: {
        preventiveCostINR: rec.estimated_preventive_cost_inr || 14000,
        expectedFailureImpactINR: rec.estimated_failure_impact_inr || 92000,
        missionDelayImpactINR: 48000,
        recommendedStrategy: "PREVENTIVE_MAINTENANCE",
        disclaimer: "Configurable maintenance cost estimates for research & GCS planning only."
      }
    };

    this.workOrders.unshift(newOrder);
    return newOrder;
  }

  updateWorkOrderStatus(orderId, status, resolutionNote = null) {
    const wo = this.workOrders.find(w => w.id === orderId);
    if (!wo) return null;
    wo.status = status;
    if (resolutionNote) {
      wo.digitalThread.resolutionLog = {
        resolvedAt: new Date().toISOString(),
        note: resolutionNote
      };
    }
    return wo;
  }

  _suggestParts(faultName) {
    if (faultName.includes("Injector") || faultName.includes("Fuel")) {
      return [
        { partNumber: "ROTAX-866-712", name: "Injector Seal Kit", qty: 4, inStock: true },
        { partNumber: "ROTAX-892-410", name: "Fuel Filter Element", qty: 1, inStock: true }
      ];
    } else if (faultName.includes("Lubrication") || faultName.includes("Oil")) {
      return [
        { partNumber: "ROTAX-825-706", name: "Oil Filter Element (Paper)", qty: 1, inStock: true },
        { partNumber: "AERO-OIL-15W50", name: "AeroShell Sport Plus 4 (Liters)", qty: 3, inStock: true }
      ];
    } else if (faultName.includes("Overheating") || faultName.includes("Thermal")) {
      return [
        { partNumber: "ROTAX-922-105", name: "Coolant Thermostat Cartridge", qty: 1, inStock: true }
      ];
    }
    return [
      { partNumber: "ROTAX-GEN-SVC", name: "Standard 50h Inspection Gasket Kit", qty: 1, inStock: true }
    ];
  }
}

module.exports = new MaintenanceService();
