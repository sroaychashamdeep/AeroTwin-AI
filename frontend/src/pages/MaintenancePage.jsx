/**
 * AEROTWIN AI - Prescriptive Maintenance Center (/maintenance)
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Filter,
  Check,
  RotateCcw,
  Calendar,
  FileText
} from 'lucide-react';

export default function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Work Order Form
  const [newTitle, setNewTitle] = useState('');
  const [newRec, setNewRec] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');

  useEffect(() => {
    loadRecords();
  }, []);

  async function loadRecords() {
    try {
      const res = await api.get('/maintenance');
      setRecords(res.data);
    } catch (err) {
      console.error('Failed to load maintenance records:', err);
    }
  }

  async function handleStatusChange(id, newStatus) {
    try {
      await api.patch(`/maintenance/${id}/status`, { status: newStatus });
      loadRecords();
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newTitle || !newRec) return;
    try {
      await api.post('/maintenance', {
        title: newTitle,
        recommendation: newRec,
        priority: newPriority,
        engine_id: 'eng_001'
      });
      setShowCreateModal(false);
      setNewTitle('');
      setNewRec('');
      loadRecords();
    } catch (err) {
      console.error('Failed to create maintenance work order:', err);
    }
  }

  const filteredRecords = filterStatus === 'ALL'
    ? records
    : records.filter(r => r.status === filterStatus);

  return (
    <div className="p-4 space-y-4 font-mono">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold text-white tracking-wider">
              PRESCRIPTIVE POWERPLANT MAINTENANCE CENTER
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-800 font-bold">
              WORK ORDER AUDIT LOG
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Actionable maintenance directives, technician dispatching, and inspection tracking
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center space-x-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4" />
            <span>NEW WORK ORDER</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 bg-aerocard p-2 rounded-lg border border-aeroborder text-xs">
        <span className="text-slate-400 flex items-center space-x-1 mr-2">
          <Filter className="w-3.5 h-3.5" />
          <span>FILTER WORK ORDERS:</span>
        </span>
        {['ALL', 'Pending', 'Inspected', 'Resolved', 'Deferred'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`px-3 py-1 rounded font-semibold transition ${
              filterStatus === st ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {st.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Work Orders List */}
      <div className="space-y-3">
        {filteredRecords.map((rec) => {
          const isPending = rec.status === 'Pending';
          const isInspected = rec.status === 'Inspected';
          const isResolved = rec.status === 'Resolved';
          const isDeferred = rec.status === 'Deferred';

          return (
            <div
              key={rec.id}
              className="bg-aerocard border border-aeroborder rounded-lg p-4 space-y-3 hover:border-slate-700 transition"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-aeroborder pb-2.5">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold text-white">{rec.title}</span>
                    <span className={`text-[10px] px-2 py-0.2 rounded font-bold border ${
                      rec.priority === 'CRITICAL' ? 'bg-red-950 border-red-700 text-red-400' :
                      rec.priority === 'HIGH' ? 'bg-amber-950 border-amber-700 text-amber-400' :
                      'bg-slate-800 border-slate-700 text-slate-300'
                    }`}>
                      {rec.priority} PRIORITY
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Engine: <span className="text-sky-300">{rec.engine_id}</span> • Triggered by: <span className="text-amber-300">{rec.triggered_by_fault || 'Manual'}</span>
                  </div>
                </div>

                {/* Status Badges & Quick Action Transitions */}
                <div className="flex items-center space-x-2 text-xs">
                  <span className={`px-2.5 py-1 rounded font-bold border ${
                    isResolved ? 'bg-emerald-950 border-emerald-800 text-emerald-400' :
                    isInspected ? 'bg-sky-950 border-sky-800 text-sky-400' :
                    isDeferred ? 'bg-slate-800 border-slate-700 text-slate-400' :
                    'bg-amber-950 border-amber-800 text-amber-400'
                  }`}>
                    {rec.status.toUpperCase()}
                  </span>

                  {/* Transitions */}
                  <div className="flex bg-aerodark rounded border border-aeroborder p-0.5">
                    {['Pending', 'Inspected', 'Resolved', 'Deferred'].map((st) => (
                      <button
                        key={st}
                        onClick={() => handleStatusChange(rec.id, st)}
                        className={`px-2 py-0.5 text-[10px] rounded font-semibold transition ${
                          rec.status === st ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recommendation Details */}
              <div className="text-xs text-slate-300 font-sans leading-relaxed bg-aerodark/60 p-3 rounded border border-aeroborder">
                <span className="font-mono font-bold text-[10px] text-sky-400 uppercase block mb-1">
                  PRESCRIPTIVE ACTION DIRECTIVE:
                </span>
                {rec.recommendation}
              </div>

              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-1">
                <span>Created: {new Date(rec.created_at).toLocaleString()}</span>
                {rec.resolved_at && <span className="text-emerald-400 font-semibold">Resolved: {new Date(rec.resolved_at).toLocaleDateString()}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Work Order Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="bg-aerocard border border-aeroborder w-full max-w-lg rounded-lg p-6 font-mono space-y-4">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">CREATE NEW MAINTENANCE WORK ORDER</h2>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">WORK ORDER TITLE:</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Inspect Cylinder 3 Fuel Injector and Flow Test"
                  className="w-full bg-aerodark border border-aeroborder rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">RECOMMENDED ACTION:</label>
                <textarea
                  value={newRec}
                  onChange={(e) => setNewRec(e.target.value)}
                  placeholder="Detailed inspection procedure and corrective action..."
                  rows={3}
                  className="w-full bg-aerodark border border-aeroborder rounded px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">PRIORITY LEVEL:</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-aerodark border border-aeroborder rounded px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                >
                  <option value="LOW">LOW</option>
                  <option value="MEDIUM">MEDIUM</option>
                  <option value="HIGH">HIGH</option>
                  <option value="CRITICAL">CRITICAL</option>
                </select>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 font-semibold"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  DISPATCH WORK ORDER
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
