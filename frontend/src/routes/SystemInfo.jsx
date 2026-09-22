import { useEffect, useState } from 'react';
import { apiGet } from '../lib/api';

export default function SystemInfo() {
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGet('/health')
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to ping /health:', err);
        setHealth(null);
        setLoading(false);
      });
  }, []);

  const pipelineSteps = [
    { id: '01', name: 'NEPS-G', role: 'Global Ensemble Inputs', detail: '12km NWP multi-model ensemble forecast fields' },
    { id: '02', name: 'Preprocessing', role: 'Feature Preparation', detail: 'Spatial grid standardization & EFI baseline normalization' },
    { id: '03', name: 'Anomaly Detection', role: 'Threshold Scanning', detail: 'EFI calculation (>0.70) against 20-year ERA5/IMDAA normal' },
    { id: '04', name: 'Spatio-Temporal GNN', role: 'Graph Trajectory Network', detail: 'Learns spatial topology & predicts centroid propagation' },
    { id: '05', name: 'Event Tracking', role: 'BBox & Uncertainty', detail: 'Dynamically bounds uncertainty radii and intensity evolution' },
    { id: '06', name: 'Conditional Diffusion', role: 'Selective Downscaling', detail: 'Guided super-resolution from 12km grid to 5km grid' },
    { id: '07', name: 'Physics Validation', role: 'Conservation Rules', detail: 'Verifies atmospheric mass, energy, and moisture limits' },
    { id: '08', name: 'Impact Engine', role: 'Exposure Assessment', detail: 'Computes multi-hazard flood, wind, heat risk levels' },
    { id: '09', name: 'Dashboard', role: 'Command Center UI', detail: 'Presents real-time interactive mapping and risk insights' },
  ];

  const components = [
    { label: 'Forecast Source', value: 'NEPS-G Ensemble', desc: '12km NWP Ensemble Forecast System' },
    { label: 'Historical Baseline', value: 'ERA5 / IMDAA', desc: '20-year atmospheric climatology' },
    { label: 'Tracking Model', value: 'Spatio-Temporal GNN', desc: 'Graph neural network for trajectory prediction' },
    { label: 'Downscaling Model', value: 'Conditional Diffusion', desc: 'Generative super-resolution (12km → 5km)' },
    { label: 'Validation Engine', value: 'Physics-Informed Bounds', desc: 'Mass and energy conservation verification' },
    { label: 'Backend Architecture', value: 'FastAPI (Python)', desc: 'Asynchronous SQLite/REST intelligence server' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 text-slate-800">
      {/* Page Header Banner */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-blue-600 uppercase">
                System Intelligence & Architecture
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-wide">
              Pipeline & Core ML Components
            </h1>
          </div>

          {/* Dynamic Backend Status Badge */}
          <div className="flex items-center space-x-2 text-xs font-mono bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <span className="text-slate-600">Backend Status:</span>
            {loading ? (
              <span className="text-amber-700 font-semibold">checking...</span>
            ) : health ? (
              <span className="text-emerald-700 font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                FastAPI — {health.status.toUpperCase()}
              </span>
            ) : (
              <span className="text-slate-500">FastAPI — Standby</span>
            )}
          </div>
        </div>

        <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
          Comprehensive overview of the end-to-end processing pipeline, model components, data sources, and system design underlying the WARSHA Command Center.
        </p>
      </div>

      {/* Section 1: End-to-End Pipeline Diagram */}
      <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="space-y-1">
            <h2 className="text-base font-bold font-mono text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span>
              End-to-End Processing Pipeline (9 Stages)
            </h2>
            <p className="text-xs text-slate-500">
              Sequential flow from raw ensemble inputs to downscaled risk visualization.
            </p>
          </div>
          <span className="text-xs font-mono text-blue-700 bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
            NEPS-G → Dashboard
          </span>
        </div>

        {/* 9-Step Diagram Flow */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-9 gap-2 relative">
          {pipelineSteps.map((step, idx) => (
            <div key={step.id} className="flex flex-col h-full">
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex-1 space-y-2 hover:border-blue-400 transition-colors group">
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span className="text-slate-500 font-bold group-hover:text-blue-700">
                    STAGE {step.id}
                  </span>
                  {idx < pipelineSteps.length - 1 && (
                    <span className="hidden lg:inline text-slate-400 font-bold">→</span>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 group-hover:text-blue-800">
                    {step.name}
                  </h3>
                  <p className="text-[10px] font-mono text-slate-500 font-medium mt-0.5">
                    {step.role}
                  </p>
                </div>
                <p className="text-[10px] text-slate-500 leading-tight pt-1 border-t border-slate-200">
                  {step.detail}
                </p>
              </div>

              {/* Mobile/Tablet Arrow Indicator */}
              {idx < pipelineSteps.length - 1 && (
                <div className="lg:hidden text-center text-slate-400 text-xs py-1">↓</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Section 2 & 3: Component Summary Table & Honest Framing Note */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Component Summary List/Table (2 Cols) */}
        <div className="lg:col-span-2 bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold uppercase font-mono tracking-wider text-slate-900 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Core System Components & Models
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Technical specification summary for models, baseline datasets, and backend infrastructure.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {components.map((comp, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-1 hover:border-slate-300 transition-colors"
              >
                <span className="text-[10px] font-mono uppercase text-slate-500 tracking-wider block">
                  {comp.label}
                </span>
                <span className="text-sm font-bold font-mono text-slate-900 block">
                  {comp.value}
                </span>
                <span className="text-[11px] text-slate-600 block pt-0.5">
                  {comp.desc}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Honest Framing Note Box (1 Col) */}
        <div className="bg-white border border-[#D9E4EE] rounded-2xl p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Architecture & Simulation Note
              </h2>
            </div>
            <div className="space-y-3 text-xs text-slate-600 leading-relaxed font-sans">
              <p>
                This operational prototype simulates the multi-stage pipeline using structured, physically consistent data derived from ensemble modeling patterns.
              </p>
              <p className="text-slate-500">
                The software architecture is modularly decoupled, ensuring production machine learning engines (GNN tracking networks and conditional diffusion downscaling models) can be directly integrated into the backend REST server without modifying frontend contracts or operational workflows.
              </p>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-[11px] font-mono text-blue-700">
            ✓ Modular ML Integration Ready
          </div>
        </div>
      </div>
    </div>
  );
}
