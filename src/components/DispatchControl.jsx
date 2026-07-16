import React, { useState, useEffect, useRef } from 'react';
import { 
  AlertCircle, 
  Truck, 
  MapPin, 
  Wrench, 
  CheckCircle,
  Clock,
  Activity,
  Radio
} from 'lucide-react';

export default function DispatchControl({ actions, onResolve }) {
  const [resolvingId, setResolvingId] = useState(null);
  const [isPlayingRadio, setIsPlayingRadio] = useState(false);
  const [radioText, setRadioText] = useState("");
  const [waveform, setWaveform] = useState([]);
  const [lastActionId, setLastActionId] = useState(null);
  
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Grid effect
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.lineWidth = 1;
      for (let y = 6; y < canvas.height; y += 10) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let x = 6; x < canvas.width; x += 10) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Flat reference line
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.15)';
      ctx.beginPath();
      ctx.moveTo(0, canvas.height / 2);
      ctx.lineTo(canvas.width, canvas.height / 2);
      ctx.stroke();

      // Audio line
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.beginPath();

      const sliceWidth = canvas.width / (waveform.length || 100);
      let x = 0;

      if (waveform.length === 0) {
        // Slight idle jitter
        for (let i = 0; i < 100; i++) {
          const noise = (Math.random() - 0.5) * 1.5;
          const y = canvas.height / 2 + noise;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      } else {
        // Real waveform peaks
        for (let i = 0; i < waveform.length; i++) {
          const v = waveform[i] / 128.0;
          const y = (v * canvas.height) / 2;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
          x += sliceWidth;
        }
      }
      ctx.stroke();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animationId);
  }, [waveform]);

  const triggerRadioBroadcast = (actionName, impact) => {
    if (isPlayingRadio) return;
    setIsPlayingRadio(true);
    const dispatchText = `Dispatch 1 to active unit: Dispatch order issued. ${actionName}. Mission objective: ${impact}. Please acknowledge, over.`;
    setRadioText(dispatchText);

    import('../utils/radio_sfx').then(({ playRadioDispatch }) => {
      playRadioDispatch(
        dispatchText,
        (waveData) => setWaveform(waveData),
        () => setIsPlayingRadio(false)
      );
    });
  };

  useEffect(() => {
    if (actions && actions.length > 0) {
      const latest = actions[0];
      if (latest.id !== lastActionId) {
        setLastActionId(latest.id);
        const ageMs = Date.now() - new Date(latest.triggered_at).getTime();
        if (ageMs < 12000) {
          triggerRadioBroadcast(latest.action_name, latest.impact);
        }
      }
    }
  }, [actions, lastActionId]);

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

      {/* TACTICAL AI RADIO TRANSMITTER PANEL */}
      <div className="bg-slate-950 text-emerald-400 rounded-xl p-4 mb-4 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)] relative overflow-hidden font-mono">
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
        
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-emerald-500/10 relative z-10">
          <div className="flex items-center gap-2">
            <Radio className={`w-4 h-4 ${isPlayingRadio ? 'text-emerald-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-[11px] font-bold tracking-widest uppercase">Tactical AI Radio Link</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className={`h-1.5 w-1.5 rounded-full ${isPlayingRadio ? 'bg-red-500 animate-ping' : 'bg-emerald-500'}`} />
            <span className="font-semibold tracking-wider">
              {isPlayingRadio ? "🔴 TRANSMITTING (TX)" : "🟢 STANDBY (RX)"}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center relative z-10">
          {/* CRT Oscilloscope Screen */}
          <div className="relative bg-slate-900 border border-emerald-500/10 rounded-lg overflow-hidden h-[60px] flex items-center justify-center">
            <canvas 
              ref={canvasRef} 
              width={260} 
              height={60} 
              className="w-full h-full"
            />
          </div>

          {/* Broadcast Text Status */}
          <div className="md:col-span-2 text-[10px] text-emerald-300/80 leading-relaxed bg-slate-900/60 p-2 rounded border border-emerald-500/5 min-h-[50px] flex flex-col justify-center">
            {isPlayingRadio ? (
              <>
                <span className="text-[9px] text-red-400 font-bold uppercase tracking-wider mb-0.5">Active Transmission:</span>
                <p className="line-clamp-2 italic font-sans">"{radioText}"</p>
              </>
            ) : (
              <span className="text-slate-500 italic text-center py-2">No active voice traffic. Standing by for field dispatches...</span>
            )}
          </div>
        </div>
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
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => triggerRadioBroadcast(act.action_name, act.impact)}
                          disabled={isPlayingRadio}
                          className="px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 disabled:opacity-50 transition-colors flex items-center gap-1"
                          title="Broadcast on Tactical Radio Link"
                          style={{ cursor: 'pointer' }}
                        >
                          <Radio className="w-3 h-3" />
                          <span>Radio</span>
                        </button>
                        <button
                          onClick={() => handleResolve(act.id)}
                          disabled={resolvingId === act.id}
                          className="px-2 py-1 rounded text-[10px] font-bold tracking-wide uppercase bg-slate-100 hover:bg-slate-200 dark:bg-slate-850 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 disabled:opacity-50 transition-colors"
                        >
                          {resolvingId === act.id ? "Resolving..." : "Force Resolve"}
                        </button>
                      </div>
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
