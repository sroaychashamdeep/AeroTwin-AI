/**
 * AEROTWIN AI - Mission Simulation, Natural Language Query & What-If Analysis Controller
 */

const axios = require('axios');
const db = require('../config/db');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

async function getMissions(req, res) {
  try {
    const missions = await db.getMissions();
    res.json(missions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function simulateMission(req, res) {
  try {
    const payload = req.body;
    // Call Python AI Service
    const aiRes = await axios.post(`${AI_SERVICE_URL}/simulate/mission`, {
      mission_type: payload.mission_type || 'ISR',
      duration_hours: Number(payload.duration_hours) || 8.0,
      altitude_ft: Number(payload.altitude_ft) || 15000.0,
      throttle_pct: Number(payload.throttle_pct) || 70.0,
      ambient_temp_c: Number(payload.ambient_temp_c) || 25.0,
      humidity_pct: Number(payload.humidity_pct) || 50.0,
      payload_weight_kg: Number(payload.payload_weight_kg) || 45.0,
      fault_scenario: payload.fault_scenario || null
    }, { timeout: 5000 });

    res.json(aiRes.data);
  } catch (err) {
    console.warn('[MissionController] AI service simulation error, running local mission model:', err.message);
    // Local fallback
    const dur = Number(req.body.duration_hours) || 8.0;
    const alt = Number(req.body.altitude_ft) || 15000.0;
    const thr = Number(req.body.throttle_pct) || 70.0;
    const temp = Number(req.body.ambient_temp_c) || 25.0;

    const fuelKg = Math.round(dur * (14.0 + (thr / 100) * 12.0) * 0.74 * 10) / 10;
    const cht = Math.round((135 + thr * 0.28 + temp * 0.4) * 10) / 10;
    const vib = Math.round((2.0 + (thr / 100) * 0.8) * 100) / 100;
    const degPct = Math.round((dur / 1200 * 100 * 1.6) * 10) / 10;
    const risk = (cht > 175 || thr > 85 || temp > 38) ? 'HIGH' : (cht > 160 ? 'MEDIUM' : 'LOW');

    res.json({
      mission_type: req.body.mission_type || 'ISR',
      duration_hours: dur,
      target_altitude_ft: alt,
      total_fuel_consumed_kg: fuelKg,
      max_cht: cht,
      max_egt: 810.0,
      max_vibration: vib,
      start_health: 95.0,
      expected_health: Math.max(10, 95.0 - degPct),
      expected_degradation_pct: degPct,
      rul_impact_hours: Math.round(dur * 1.3 * 10) / 10,
      thermal_risk: cht > 175 ? 'HIGH' : (cht > 160 ? 'MEDIUM' : 'LOW'),
      vibration_risk: 'LOW',
      mission_risk: risk,
      recommendation: `Simulated ${req.body.mission_type || 'ISR'} flight profile. Expected fuel burn: ${fuelKg} kg with ${risk} operational risk.`,
      timeline: []
    });
  }
}

/**
 * Natural Language Mission Query Parser
 * Parses prompts like: "Simulate a 10 hour ISR mission at 15000 ft with 70% throttle and 35°C ambient temperature."
 */
async function parseNaturalLanguageQuery(req, res) {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

    const text = prompt.toLowerCase();

    // 1. Duration extraction (e.g. "10 hour", "8.5 hrs", "12h")
    let duration = 8.0;
    const durMatch = text.match(/(\d+(\.\d+)?)\s*(hour|hr|h\b)/i);
    if (durMatch) duration = parseFloat(durMatch[1]);

    // 2. Altitude extraction (e.g. "15000 ft", "18,000 feet", "FL150")
    let altitude = 15000.0;
    const altMatch = text.match(/(\d+[\d,]*)\s*(ft|feet|fl)/i);
    if (altMatch) {
      altitude = parseFloat(altMatch[1].replace(/,/g, ''));
    }

    // 3. Throttle extraction (e.g. "70% throttle", "75 percent power")
    let throttle = 70.0;
    const thrMatch = text.match(/(\d+(\.\d+)?)\s*(%|percent)\s*(throttle|power)?/i) || text.match(/throttle\s*(at|of|to)?\s*(\d+(\.\d+)?)/i);
    if (thrMatch) {
      throttle = parseFloat(thrMatch[1] || thrMatch[2]);
    }

    // 4. Ambient Temperature (e.g. "35°C", "40 C", "-10 degrees")
    let ambientTemp = 25.0;
    const tempMatch = text.match(/(-?\d+(\.\d+)?)\s*(°c|c\b|deg|degrees)/i);
    if (tempMatch) ambientTemp = parseFloat(tempMatch[1]);

    // 5. Mission Type (ISR, Maritime, Relay, Endurance, Hot-Weather)
    let missionType = "ISR";
    if (text.includes("maritime") || text.includes("sea") || text.includes("coastal")) {
      missionType = "Maritime Surveillance";
    } else if (text.includes("relay") || text.includes("communication")) {
      missionType = "Communication Relay";
    } else if (text.includes("hot") || text.includes("desert")) {
      missionType = "Hot-Weather";
    } else if (text.includes("endurance") || text.includes("long")) {
      missionType = "Endurance";
    }

    const extractedParams = {
      duration_hours: duration,
      altitude_ft: altitude,
      throttle_pct: throttle,
      ambient_temp_c: ambientTemp,
      mission_type: missionType
    };

    // Execute simulation with extracted parameters
    const aiRes = await axios.post(`${AI_SERVICE_URL}/simulate/mission`, extractedParams, { timeout: 5000 })
      .then(r => r.data)
      .catch(() => null);

    res.json({
      parsed_query: prompt,
      extracted_parameters: extractedParams,
      simulation_results: aiRes || {
        mission_type: missionType,
        duration_hours: duration,
        target_altitude_ft: altitude,
        total_fuel_consumed_kg: Math.round(duration * 18.5),
        expected_health: 91.2,
        thermal_risk: ambientTemp > 35 ? 'HIGH' : 'LOW',
        mission_risk: ambientTemp > 35 || throttle > 80 ? 'HIGH' : 'LOW'
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * What-If Analysis: Side-by-side Comparative Simulation
 */
async function runWhatIfAnalysis(req, res) {
  try {
    const { missionA, missionB } = req.body;
    if (!missionA || !missionB) {
      return res.status(400).json({ error: 'Both missionA and missionB parameters are required.' });
    }

    const [resA, resB] = await Promise.all([
      axios.post(`${AI_SERVICE_URL}/simulate/mission`, missionA, { timeout: 5000 }).then(r => r.data),
      axios.post(`${AI_SERVICE_URL}/simulate/mission`, missionB, { timeout: 5000 }).then(r => r.data)
    ]);

    // Calculate delta comparison metrics
    const deltaFuel = Number((resB.total_fuel_consumed_kg - resA.total_fuel_consumed_kg).toFixed(1));
    const deltaCht = Number((resB.max_cht - resA.max_cht).toFixed(1));
    const deltaHealth = Number((resB.expected_health - resA.expected_health).toFixed(1));
    const deltaRulImpact = Number((resB.rul_impact_hours - resA.rul_impact_hours).toFixed(1));

    // Automated recommendation
    let recommendation;
    if (resB.mission_risk === 'HIGH' || resB.mission_risk === 'CRITICAL' && resA.mission_risk !== 'HIGH') {
      recommendation = `Mission A is strongly recommended. Mission B incurs +${deltaCht}°C higher cylinder head temperatures, +${deltaFuel} kg extra fuel consumption, and higher degradation risk (${resB.mission_risk}).`;
    } else if (resA.mission_risk === 'HIGH' && resB.mission_risk !== 'HIGH') {
      recommendation = `Mission B is recommended. Mission A presents elevated thermal risk (${resA.mission_risk}).`;
    } else {
      recommendation = resA.expected_health >= resB.expected_health
        ? `Mission A offers superior powerplant longevity with lower degradation (${resA.expected_degradation_pct}% vs ${resB.expected_degradation_pct}%).`
        : `Mission B provides balanced fuel economy with acceptable thermal margins.`;
    }

    res.json({
      missionA: resA,
      missionB: resB,
      comparison: {
        delta_fuel_kg: deltaFuel,
        delta_max_cht_c: deltaCht,
        delta_health_pct: deltaHealth,
        delta_rul_impact_hours: deltaRulImpact,
        safer_mission: resA.expected_health >= resB.expected_health ? 'Mission A' : 'Mission B'
      },
      recommendation
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = {
  getMissions,
  simulateMission,
  parseNaturalLanguageQuery,
  runWhatIfAnalysis
};
