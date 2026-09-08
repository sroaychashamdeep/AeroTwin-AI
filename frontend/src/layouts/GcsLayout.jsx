/**
 * AEROTWIN AI - Ground Control Station Main Application Layout
 */

import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import GcsNavbar from '../components/GcsNavbar';
import GcsSidebar from '../components/GcsSidebar';
import FaultInjectorModal from '../components/FaultInjectorModal';
import { useTelemetryStore } from '../store/telemetryStore';

export default function GcsLayout() {
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const initSocket = useTelemetryStore((state) => state.initSocket);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  return (
    <div className="min-h-screen bg-aeroblack text-slate-100 flex flex-col font-mono">
      {/* Top GCS Command Bar */}
      <GcsNavbar onOpenFaultModal={() => setIsFaultModalOpen(true)} />

      {/* Main Body: Sidebar + Dynamic Workspace View */}
      <div className="flex-1 flex overflow-hidden">
        <GcsSidebar />
        <main className="flex-1 overflow-y-auto bg-aeroblack">
          <Outlet context={{ onOpenFaultModal: () => setIsFaultModalOpen(true) }} />
        </main>
      </div>

      {/* Global Fault Injection & Demo Modal */}
      <FaultInjectorModal
        isOpen={isFaultModalOpen}
        onClose={() => setIsFaultModalOpen(false)}
      />
    </div>
  );
}
