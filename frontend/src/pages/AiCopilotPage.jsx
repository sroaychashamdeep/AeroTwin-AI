/**
 * AEROTWIN AI - NLP / Grok Propulsion Maintenance Copilot (/ai-copilot)
 */

import React, { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useTelemetryStore } from '../store/telemetryStore';
import {
  Bot,
  Send,
  Sparkles,
  ShieldCheck,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Cpu,
  User
} from 'lucide-react';

const QUICK_PROMPTS = [
  "Why is engine health decreasing?",
  "Can this engine complete the next 8-hour mission?",
  "Explain the active anomaly and root cause.",
  "What maintenance inspection should be performed first?",
  "Why is Remaining Useful Life (RUL) decreasing?",
  "Summarize the active mission propulsion risk."
];

export default function AiCopilotPage() {
  const { telemetry, fault, anomaly, health, explanation, twinSync } = useTelemetryStore();
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      source: 'AEROTWIN Propulsion Copilot',
      content: `### 1. Engineering Assessment
AEROTWIN Decision-Support Copilot online. I am actively monitoring Rotax 914/915 iS telemetry for UAV-001 (GARUDA-01).

Current engine health index is **${health.overall_health}%** with **${health.rul_hours} hours** estimated RUL.
Active classification: **${fault.primary_fault}** (${(fault.probability * 100).toFixed(0)}% confidence).

Select a quick inquiry below or ask a specific powerplant question.`,
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textToSend = null) => {
    const query = textToSend || input;
    if (!query.trim() || loading) return;

    const userMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      // Build telemetry context package
      const contextData = {
        telemetry,
        fault,
        anomaly,
        health,
        explanation,
        mission: {
          code: 'MSN-ISR-0841',
          type: 'ISR',
          altitude: telemetry.altitude,
          throttle: telemetry.throttle
        }
      };

      const res = await api.post('/ai/chat', {
        prompt: query,
        context: contextData
      });

      const assistantMessage = {
        role: 'assistant',
        source: res.data.source || 'Propulsion Copilot',
        content: res.data.response,
        timestamp: new Date().toLocaleTimeString()
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Copilot request failed:', err);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          source: 'System Error',
          content: 'Unable to process propulsion query. Please verify backend connectivity.',
          timestamp: new Date().toLocaleTimeString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col font-mono bg-aeroblack p-4 overflow-hidden">
      {/* Header */}
      <div className="bg-aerodark border border-aeroborder p-4 rounded-lg flex items-center justify-between z-10 shrink-0 mb-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-600 to-sky-600 flex items-center justify-center text-white shadow-lg shadow-cyan-950/40">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-sm font-bold text-white tracking-wider">AEROTWIN AI PROPULSION COPILOT</h1>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 border border-cyan-700 text-cyan-300 font-bold">
                GROK-POWERED & OFFLINE RESILIENT
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Context-Aware Aerospace Engineering Decision Support</p>
          </div>
        </div>

        {/* Live Context Indicators */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          <div className="px-2.5 py-1 rounded bg-aerocard border border-aeroborder text-slate-300">
            HEALTH: <span className="text-emerald-400 font-bold">{health.overall_health}%</span>
          </div>
          <div className="px-2.5 py-1 rounded bg-aerocard border border-aeroborder text-slate-300">
            PRIMARY FAULT: <span className={fault.primary_fault === 'Healthy' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>{fault.primary_fault}</span>
          </div>
        </div>
      </div>

      {/* Chat Messages Log Area */}
      <div className="flex-1 bg-aerocard border border-aeroborder rounded-lg p-4 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center space-x-2 text-[10px] text-slate-400 mb-1 px-1">
              {msg.role === 'user' ? <User className="w-3 h-3 text-sky-400" /> : <Bot className="w-3 h-3 text-cyan-400" />}
              <span className="font-bold text-slate-300">{msg.role === 'user' ? 'Flight Engineer' : msg.source}</span>
              <span>•</span>
              <span>{msg.timestamp}</span>
            </div>

            <div
              className={`max-w-3xl rounded-lg p-4 text-xs font-sans leading-relaxed border ${
                msg.role === 'user'
                  ? 'bg-sky-950/70 border-sky-600/80 text-white'
                  : 'bg-aerodark border-aeroborder text-slate-200 shadow-md'
              }`}
            >
              {/* Formatted Markdown Rendering */}
              <div className="space-y-2 whitespace-pre-wrap font-sans">
                {msg.content}
              </div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-xs text-cyan-400 bg-aerodark p-3 rounded border border-aeroborder max-w-xs animate-pulse">
            <Bot className="w-4 h-4 animate-spin" />
            <span>Analyzing real-time propulsion context...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Prompts Carousel / Bar */}
      <div className="my-2 flex items-center space-x-2 overflow-x-auto py-1 shrink-0">
        <span className="text-[10px] text-slate-400 shrink-0 font-bold uppercase">QUICK QUERIES:</span>
        {QUICK_PROMPTS.map((qp, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(qp)}
            disabled={loading}
            className="px-2.5 py-1 rounded bg-aerocard border border-aeroborder hover:border-sky-500 text-[11px] text-slate-300 hover:text-white whitespace-nowrap transition"
          >
            {qp}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex space-x-2 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask Grok Copilot about powerplant thermal margin, vibration anomalies, or mission completion risk..."
          className="flex-1 bg-aerodark border border-aeroborder rounded px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-5 py-2.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition flex items-center space-x-2 disabled:opacity-50 shadow-lg shadow-sky-950/40"
        >
          <Send className="w-4 h-4" />
          <span>SUBMIT</span>
        </button>
      </form>
    </div>
  );
}
