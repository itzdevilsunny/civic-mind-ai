import React, { useState, useEffect } from 'react';
import { Heart, Navigation, AlertTriangle, Shield, Trash2, Zap, MessageSquare, Compass, Terminal, ShieldCheck } from 'lucide-react';

const agentData = [
  {
    id: 1,
    name: 'Community Health Agent',
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    competencies: ['Outbreak Prediction', 'Hospital Demand forecasting', 'Medication Stock Alerting'],
    status: 'Idle',
    activity: 'Analyzing clinic admissions data...',
    theme: 'rose'
  },
  {
    id: 2,
    name: 'Traffic Intelligence Agent',
    icon: <Navigation className="w-5 h-5 text-emerald-500" />,
    competencies: ['Congestion Forecasting', 'Signal Offset Adjustments', 'Rerouting Suggestions'],
    status: 'Processing',
    activity: 'Calculating gridlocks near Sector 18 off-ramp...',
    theme: 'emerald'
  },
  {
    id: 3,
    name: 'Disaster Response Agent',
    icon: <AlertTriangle className="w-5 h-5 text-red-500" />,
    competencies: ['Flood level models', 'Evacuation plan calculation', 'SMS Warning Broadcasts'],
    status: 'Coordinating',
    activity: 'Correlating radar maps with river telemetry...',
    theme: 'red'
  },
  {
    id: 4,
    name: 'Public Safety Agent',
    icon: <Shield className="w-5 h-5 text-indigo-500" />,
    competencies: ['Crime hotspot mapping', 'CCTV anomaly feeds', 'Accident risk profiling'],
    status: 'Idle',
    activity: 'Scanning crowd safety parameters in Sector 3...',
    theme: 'indigo'
  },
  {
    id: 5,
    name: 'Waste Management Agent',
    icon: <Trash2 className="w-5 h-5 text-teal-500" />,
    competencies: ['Bin capacity metrics', 'Optimized truck routing', 'Schedule adjustments'],
    status: 'Idle',
    activity: 'Tracking fill volumes of smart dustbins...',
    theme: 'teal'
  },
  {
    id: 6,
    name: 'Energy Intelligence Agent',
    icon: <Zap className="w-5 h-5 text-yellow-500" />,
    competencies: ['Substation peak grids', 'Solar farm forecasting', 'Load shedding preventions'],
    status: 'Processing',
    activity: 'Balancing solar outputs with peak heatwave usage...',
    theme: 'yellow'
  },
  {
    id: 7,
    name: 'Citizen Engagement Agent',
    icon: <MessageSquare className="w-5 h-5 text-purple-500" />,
    competencies: ['Complaints classifications', 'Department assigning', 'Escalations alerts'],
    status: 'Idle',
    activity: 'Awaiting new complaint submissions...',
    theme: 'purple'
  },
  {
    id: 8,
    name: 'Tourism Agent',
    icon: <Compass className="w-5 h-5 text-sky-500" />,
    competencies: ['Crowd density guides', 'Hotel volume indices', 'Nearby route planning'],
    status: 'Idle',
    activity: 'Mapping foot traffic near museum quarters...',
    theme: 'sky'
  }
];

const logPool = [
  "Community Health Agent: Running correlation scan on clinical reports. Outbreak risk: LOW (2.4%).",
  "Traffic Agent: Signal cycle increased by 25s at Broadway. Traffic queue length reduced by 14%.",
  "Disaster Agent: Rain sensors indicating 12mm/hr. River levels rising but within safety margins.",
  "Public Safety Agent: Anomaly flagged on CCTV feed #182. License plate recorded. Assigning officer.",
  "Waste Agent: Bin #48 in Commercial Downtown filled to 85%. Dispatched garbage truck #12.",
  "Energy Agent: Substation E load reached 92%. Redirected 2.5 MW backup reserve from Station North.",
  "Citizen Agent: Classifying complaint ID #9482 as Category: Roads & Bridges. Routed successfully.",
  "Tourism Agent: Cultural district footfalls rising. Recommended parking diversion notice."
];

export default function MultiAgentStatus() {
  const [agents, setAgents] = useState(agentData);
  const [logs, setLogs] = useState([
    "System booted. All 8 AI Agents checked in.",
    "Gemini conversation layer initiated successfully.",
    "Connecting Pub/Sub queues to BigQuery warehouse..."
  ]);

  // Periodically change agent states and emit new log events
  useEffect(() => {
    const interval = setInterval(() => {
      // 1. Pick a random log to append
      const randomLog = logPool[Math.floor(Math.random() * logPool.length)];
      setLogs(prev => [randomLog, ...prev].slice(0, 10));

      // 2. Randomly change an agent's status
      setAgents(prevAgents => {
        const idx = Math.floor(Math.random() * prevAgents.length);
        const statusPool = ['Idle', 'Processing', 'Coordinating', 'Alerted'];
        const newStatus = statusPool[Math.floor(Math.random() * statusPool.length)];
        
        return prevAgents.map((agent, i) => {
          if (i === idx) {
            return {
              ...agent,
              status: newStatus,
              activity: newStatus === 'Idle' 
                ? 'Awaiting pipeline stream...' 
                : newStatus === 'Processing'
                ? 'Executing analytics script on BigQuery...'
                : newStatus === 'Coordinating'
                ? 'Sharing contextual frames with Public Safety Agent...'
                : 'FLAGGED ALERT: Telemetry threshold check triggered!'
            };
          }
          return agent;
        });
      });
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'Idle': return 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700';
      case 'Processing': return 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800';
      case 'Coordinating': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800';
      case 'Alerted': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-450 dark:border-rose-800';
      default: return '';
    }
  };

  // Assign subtle color glows based on agent theme
  const getCardThemeClass = (theme) => {
    switch (theme) {
      case 'rose': return 'hover:shadow-rose-100 dark:hover:shadow-rose-950/20 border-rose-150 dark:border-rose-950/30';
      case 'emerald': return 'hover:shadow-emerald-100 dark:hover:shadow-emerald-950/20 border-emerald-150 dark:border-emerald-950/30';
      case 'red': return 'hover:shadow-red-100 dark:hover:shadow-red-950/20 border-red-150 dark:border-red-950/30';
      case 'indigo': return 'hover:shadow-indigo-100 dark:hover:shadow-indigo-950/20 border-indigo-150 dark:border-indigo-950/30';
      case 'teal': return 'hover:shadow-teal-100 dark:hover:shadow-teal-950/20 border-teal-150 dark:border-teal-950/30';
      case 'yellow': return 'hover:shadow-yellow-100 dark:hover:shadow-yellow-950/20 border-yellow-150 dark:border-yellow-950/30';
      case 'purple': return 'hover:shadow-purple-100 dark:hover:shadow-purple-950/20 border-purple-150 dark:border-purple-950/30';
      case 'sky': return 'hover:shadow-sky-100 dark:hover:shadow-sky-950/20 border-sky-150 dark:border-sky-950/30';
      default: return '';
    }
  };

  // Colorize log text based on emitting agent in the console
  const getLogTextColor = (log) => {
    if (log.includes("Health Agent")) return "text-rose-400";
    if (log.includes("Traffic Agent")) return "text-emerald-400";
    if (log.includes("Disaster Agent")) return "text-red-400";
    if (log.includes("Safety Agent")) return "text-indigo-400";
    if (log.includes("Waste Agent")) return "text-teal-400";
    if (log.includes("Energy Agent")) return "text-yellow-300";
    if (log.includes("Citizen Agent")) return "text-purple-400";
    if (log.includes("Tourism Agent")) return "text-sky-400";
    return "text-slate-400";
  };

  return (
    <div className="card">
      <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <ShieldCheck className="w-5 h-5 text-indigo-600" /> Multi-Agent Collaboration Monitor
        </h3>
        <span className="card-subtitle">Specialized AI agents co-operating to analyze datasets and resolve city demands</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {agents.map(agent => (
          <div 
            key={agent.id} 
            className={`border rounded-xl p-4 bg-slate-50/40 dark:bg-slate-900/10 flex flex-col justify-between transition-all hover:scale-[1.01] ${getCardThemeClass(agent.theme)}`}
          >
            <div>
              <div className="flex justify-between items-start gap-2 mb-3">
                <div className="p-2 bg-white dark:bg-slate-900 rounded-lg shadow-sm border border-slate-100 dark:border-slate-850">
                  {agent.icon}
                </div>
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusColor(agent.status)}`}>
                  {agent.status}
                </span>
              </div>
              
              <h4 className="font-bold text-sm text-slate-850 dark:text-slate-200 mb-1.5">{agent.name}</h4>
              
              <div className="flex flex-wrap gap-1 mb-4">
                {agent.competencies.map((comp, idx) => (
                  <span key={idx} className="text-[9px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 font-medium">
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/60 pt-2.5 mt-2">
              <span className="text-[9px] text-slate-400 font-semibold block uppercase">Active Operation</span>
              <p className="text-[11px] text-slate-600 dark:text-slate-350 truncate mt-0.5 font-mono">
                {agent.activity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Terminal Live logs */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-950 text-slate-200 shadow-lg">
        <div className="bg-[#0f172a] px-4 py-2 flex items-center justify-between border-b border-slate-850">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-semibold font-mono text-indigo-400">multi_agent_collaboration.log</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 opacity-60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 opacity-60"></div>
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 opacity-60"></div>
          </div>
        </div>
        <div className="p-4 font-mono text-xs flex flex-col gap-2.5 max-h-[180px] overflow-y-auto">
          {logs.map((log, idx) => (
            <div key={idx} className="flex gap-2.5 items-start">
              <span className="text-slate-600 flex-shrink-0">[{new Date().toLocaleTimeString()}]</span>
              <span className={`break-all leading-relaxed ${getLogTextColor(log)}`}>
                {log}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
