/**
 * AEROTWIN AI - React Router Application Entry Point
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useOutletContext } from 'react-router-dom';

import GcsLayout from './layouts/GcsLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import LiveTelemetryPage from './pages/LiveTelemetryPage';
import DiagnosticsPage from './pages/DiagnosticsPage';
import RulDegradationPage from './pages/RulDegradationPage';
import MissionSimulatorPage from './pages/MissionSimulatorPage';
import MissionReplayPage from './pages/MissionReplayPage';
import WhatIfPage from './pages/WhatIfPage';
import FleetPage from './pages/FleetPage';
import MaintenancePage from './pages/MaintenancePage';
import AiCopilotPage from './pages/AiCopilotPage';
import ReportsPage from './pages/ReportsPage';
import ModelValidationPage from './pages/ModelValidationPage';
import SettingsPage from './pages/SettingsPage';

function DashboardRouteWrapper() {
  const { onOpenFaultModal } = useOutletContext();
  return <DashboardPage onOpenFaultModal={onOpenFaultModal} />;
}

function DigitalTwinRouteWrapper() {
  const { onOpenFaultModal } = useOutletContext();
  return <DigitalTwinPage onOpenFaultModal={onOpenFaultModal} />;
}

function DiagnosticsRouteWrapper() {
  const { onOpenFaultModal } = useOutletContext();
  return <DiagnosticsPage onOpenFaultModal={onOpenFaultModal} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Landing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* GCS Application Shell */}
        <Route element={<GcsLayout />}>
          <Route path="/dashboard" element={<DashboardRouteWrapper />} />
          <Route path="/digital-twin" element={<DigitalTwinRouteWrapper />} />
          <Route path="/live-telemetry" element={<LiveTelemetryPage />} />
          <Route path="/ai-diagnostics" element={<DiagnosticsRouteWrapper />} />
          <Route path="/rul-degradation" element={<RulDegradationPage />} />
          <Route path="/mission-simulator" element={<MissionSimulatorPage />} />
          <Route path="/mission-replay" element={<MissionReplayPage />} />
          <Route path="/what-if" element={<WhatIfPage />} />
          <Route path="/fleet" element={<FleetPage />} />
          <Route path="/maintenance" element={<MaintenancePage />} />
          <Route path="/ai-copilot" element={<AiCopilotPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/model-validation" element={<ModelValidationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
