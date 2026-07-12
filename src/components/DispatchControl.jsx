import React, { useState } from 'react';
import { 
  AlertCircle, 
  Truck, 
  MapPin, 
  Wrench, 
  CheckCircle,
  Clock,
  Activity
} from 'lucide-react';

export default function DispatchControl({ actions, onResolve }) {
  const [resolvingId, setResolvingId] = useState(null);

  const handleResolve = (actionId) => {
    setResolvingId(actionId);
    fetch('/api/action/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action_id: actionId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          if (onResolve) onResolve();
        }
      })
      .catch(err => console.error("Failed to resolve action:", err))
      .finally(() => setResolvingId(null));
  };

  const stages = [
    { level: 1, label: 'Alerted', icon: AlertCircle, color: '#3b82f6' },
    { level: 2, label: 'En Route', icon: Truck, color: '#6366f1' },
    { level: 3, label: 'On Site', icon: MapPin, color: '#eab308' },
    { level: 4, label: 'Cleanup', icon: Wrench, color: '#8b5cf6' },
    { level: 5, label: 'Resolved', icon: CheckCircle, color: '#10b981' }
  ];

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="panel-container">
      <div className="flex items-center justify-between mb-4">
        <h3 className="panel-title flex items-center gap-2">
          <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
          <span>Actuator Dispatch Control Center</span>
        </h3>
        <span className="badge badge-info flex items-center gap-1">
          <Clock className="w-3 h-3" /> Live Stepper Tracker
        </span>
      </div>

      {actions.length === 0 ? (
        <div className="text-center py-8 text-slate-550">
          <p className="text-sm">No dispatches logged in this session.</p>
          <p className="text-xs text-slate-450 mt-1">Use the AI Copilot suggestions or Manual Actions to dispatch response units.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {actions.map((act) => {
            const currentStage = act.stage || 1;
            return (
              <div 
                key={act.id} 
                className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all duration-300"
              >
                {/* Top Title Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                      {act.action_name}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {act.impact}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-450 font-mono">
                      {formatTime(act.triggered_at)}
                    </span>
                    {currentStage < 5 && (
                      <button
                        onClick={() => handleResolve(act.id)}
                        disabled={resolvingId === act.id}
                        className="px-2.5 py-1 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                      >
                        {resolvingId === act.id ? "Resolving..." : "Force Resolve"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress Stepper Track */}
                <div className="relative mt-6 mb-2 px-2">
                  {/* Stepper background line */}
                  <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 dark:bg-slate-850 -translate-y-1/2 z-0 rounded-full" />
                  
                  {/* Stepper active line */}
                  <div 
                    className="absolute top-1/2 left-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500 -translate-y-1/2 z-0 rounded-full transition-all duration-500" 
                    style={{ width: `${((currentStage - 1) / 4) * 100}%` }}
                  />

                  {/* Stepper Node Points */}
                  <div className="flex items-center justify-between relative z-10">
                    {stages.map((stg) => {
                      const Icon = stg.icon;
                      const isCompleted = currentStage >= stg.level;
                      const isActive = currentStage === stg.level;
                      return (
                        <div key={stg.level} className="flex flex-col items-center">
                          <div 
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                              isActive
                                ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.4)] animate-pulse scale-110'
                                : isCompleted
                                  ? 'bg-emerald-500 border-emerald-500 text-white'
                                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-405'
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-500' : isCompleted ? 'text-white' : 'text-slate-400'}`} />
                          </div>
                          <span 
                            className={`text-[9px] mt-1.5 font-bold tracking-tight ${
                              isActive
                                ? 'text-indigo-600 dark:text-indigo-400 font-extrabold'
                                : isCompleted
                                  ? 'text-slate-700 dark:text-slate-350'
                                  : 'text-slate-400'
                            }`}
                          >
                            {stg.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
