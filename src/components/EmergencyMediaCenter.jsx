import React from 'react';
import { 
  X, 
  ShieldAlert, 
  AlertTriangle, 
  MapPin, 
  Clock, 
  FileText, 
  CheckCircle,
  Activity,
  Radio
} from 'lucide-react';

export default function EmergencyMediaCenter({ isOpen, onClose, crisis, actions = [] }) {
  if (!isOpen || !crisis) return null;

  // Find related actions logged in the database
  const relatedActions = actions.filter(act => 
    act.action_name.toLowerCase().includes(crisis.category.toLowerCase()) || 
    (act.impact && act.impact.toLowerCase().includes(crisis.id.toLowerCase()))
  );

  // Category specific safety guidelines mapping
  const guidelines = {
    "Sanitation & Waste": [
      "Isolate raw runoff channels and seal primary drains.",
      "Deploy absorbent containment booms for chemical/fluid spills.",
      "Issue public notice to avoid surface-level contacts in the ward."
    ],
    "Utilities & Lighting": [
      "De-energize regional grid segments surrounding the failure node.",
      "Activate backup generators and battery storage units for critical zones.",
      "Deploy auxiliary water/power conduits to bypass the damage point."
    ],
    "Roads & Bridges": [
      "Deploy automatic physical barricades and lane detours.",
      "Impose immediate vehicle weight restrictions on the bridge/road node.",
      "Dispatch public works structural inspection engineers for safety checks."
    ],
    "Noise & Disturbance": [
      "Establish police command boundaries at adjacent intersections.",
      "Mobilize civil negotiators to resolve disturbance/protest events.",
      "Continuous decibel monitoring on nearest IoT acoustic nodes."
    ],
    "Traffic Anomaly": [
      "Configure signal controller overrides to flush congested lanes.",
      "Broadcast GPS-based detour notifications to city transit lines.",
      "Dispatch transit marshals to manage manual routing at critical joints."
    ]
  };

  const activeGuidelines = guidelines[crisis.category] || [
    "Secure the immediate perimeter and restrict public entry.",
    "Monitor nearby IoT sensor feeds for anomalies.",
    "Wait for municipal emergency services to report on-site."
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh] animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Banner Grid Header */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white p-5 relative overflow-hidden flex items-center justify-between">
          {/* Animated signal rings */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.15)_0,transparent_70%)] pointer-events-none animate-pulse" />
          
          <div className="flex items-center gap-3 relative z-10">
            <div className="h-9 w-9 rounded-lg bg-white/10 backdrop-blur flex items-center justify-center border border-white/20 animate-pulse">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-red-700 text-[9px] font-black uppercase px-1.5 py-0.5 rounded tracking-widest animate-pulse">Live Briefing</span>
                <span className="text-[10px] text-white/80 font-semibold tracking-wider font-mono">ID: {crisis.id}</span>
              </div>
              <h3 className="text-lg font-black tracking-tight mt-0.5">CRISIS INTELLIGENCE CENTER</h3>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 rounded-lg bg-black/15 hover:bg-black/25 flex items-center justify-center text-white border border-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Content */}
        <div className="p-6 overflow-y-auto flex flex-col gap-6">
          
          {/* Section 1: Incident Dossier */}
          <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100 dark:border-slate-850">
            <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-mono block mb-1">Incident Dossier</span>
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <h4 className="font-bold text-slate-900 dark:text-slate-100 text-base">{crisis.title}</h4>
                <p className="text-xs text-slate-650 dark:text-slate-350 mt-1 leading-relaxed">{crisis.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-800 text-[10px]">
              <div>
                <span className="text-slate-450 block">CATEGORY</span>
                <strong className="text-slate-700 dark:text-slate-300 font-bold">{crisis.category}</strong>
              </div>
              <div>
                <span className="text-slate-450 block">PRIORITY LEVEL</span>
                <span className="text-red-500 dark:text-red-400 font-extrabold uppercase tracking-wide">{crisis.priority}</span>
              </div>
              <div>
                <span className="text-slate-450 block">DETECTION MODE</span>
                <strong className="text-slate-700 dark:text-slate-300">Citizen Ingestion</strong>
              </div>
              <div>
                <span className="text-slate-450 block">REPORTED AT</span>
                <strong className="text-slate-700 dark:text-slate-300 font-mono">
                  {new Date(crisis.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
              </div>
            </div>
          </div>

          {/* Section 2: AI Safety Action Checklist */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              <span>AI-Generated Safety Directives</span>
            </h4>
            <div className="flex flex-col gap-2.5">
              {activeGuidelines.map((guide, idx) => (
                <div 
                  key={idx} 
                  className="flex items-start gap-2.5 p-3 rounded-lg border border-slate-100 dark:border-slate-850 bg-emerald-500/[0.02] dark:bg-emerald-500/[0.01]"
                >
                  <span className="h-5 w-5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-sans">{guide}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Dispatched Containment Assets */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200 mb-3 flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-indigo-500" />
              <span>Mobilized Containment Assets</span>
            </h4>

            {relatedActions.length === 0 ? (
              <div className="border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-6 text-center text-slate-450 bg-slate-50/20 dark:bg-slate-900/10">
                <Radio className="w-6 h-6 text-slate-400 mx-auto animate-pulse mb-2" />
                <p className="text-xs font-semibold">Asset Dispatch In Queue</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Awaiting Administrator command or Autopilot routing schedule.</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {relatedActions.map(act => (
                  <div 
                    key={act.id}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-indigo-500/10 bg-indigo-500/[0.01] dark:bg-indigo-500/[0.005]"
                  >
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{act.action_name}</span>
                          <span className="bg-indigo-100 dark:bg-indigo-950/60 text-indigo-750 dark:text-indigo-400 font-bold text-[8px] px-1.5 py-0.5 rounded tracking-wide font-mono uppercase">{act.id}</span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{act.impact}</p>
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase text-indigo-600 dark:text-indigo-400 tracking-wider">
                      {act.status || "Active"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Footer info line */}
        <div className="bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-850 p-4 text-center text-[10px] text-slate-450 font-mono">
          CivicMind Crisis Broadcast Center • Localized Coordination System
        </div>
      </div>
    </div>
  );
}
