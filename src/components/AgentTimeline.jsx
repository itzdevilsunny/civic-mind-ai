import { useState, useEffect, useRef } from "react";
import { Network, TrafficCone, Zap, Shield, Users, Download, Filter } from "lucide-react";

const AGENTS = {
  "Traffic Intelligence Agent": { color: "#10b981", icon: TrafficCone, short: "TIA" },
  "Energy Intelligence Agent":  { color: "#f59e0b", icon: Zap,          short: "EIA" },
  "Public Safety Agent":        { color: "#f43f5e", icon: Shield,        short: "PSA" },
  "Citizen Engagement Agent":   { color: "#6366f1", icon: Users,         short: "CEA" },
};

const AGENT_NAMES = Object.keys(AGENTS);

const SEVERITY_STYLES = {
  critical: { bg: "rgba(244,63,94,0.1)",   border: "#f43f5e40", color: "#f43f5e", label: "CRITICAL" },
  warning:  { bg: "rgba(245,158,11,0.1)",  border: "#f59e0b40", color: "#f59e0b", label: "WARNING"  },
  info:     { bg: "rgba(99,102,241,0.08)", border: "#6366f140", color: "#6366f1", label: "INFO"     },
};

function generateEvent(weather, aqi, ticketCount, cityName = 'City') {
  const now = Date.now();
  const id = `evt-${now}-${Math.random().toString(36).slice(2, 7)}`;

  const pools = [
    {
      agent: "Traffic Intelligence Agent",
      severity: "info",
      messages: [
        `Synchronized signal timing across ${cityName} central corridor. Avg delay reduced by 18%.`,
        `Rerouting buses in ${cityName} due to ${ticketCount > 2 ? "active incidents" : "maintenance window"}.`,
        "Coordinating with Energy Agent on EV charging bay load during peak hours.",
        `Congestion index updated: current level MODERATE across ${cityName} zones.`,
        "Shared live bus occupancy feed with Citizen Engagement Agent for commuter updates.",
      ],
    },
    {
      agent: "Energy Intelligence Agent",
      severity: weather?.condition?.includes("Rain") ? "warning" : "info",
      messages: [
        `Solar microgrid output at ${Math.round(40 + Math.random() * 45)}% capacity — adjusting grid draw from mains.`,
        `Load-balancing street lighting across ${cityName} districts post-sunset.`,
        `Detected abnormal draw spike at ${cityName} substation. Alerting Public Safety Agent.`,
        `Renewable grid mix at ${Math.round(55 + Math.random() * 30)}%. Carbon offset updated.`,
        "Coordinating with Traffic Agent to optimize EV charging schedules for off-peak windows.",
      ],
    },
    {
      agent: "Public Safety Agent",
      severity: aqi > 50 ? "critical" : ticketCount > 3 ? "warning" : "info",
      messages: [
        aqi > 50 ? `AQI breach detected: ${aqi} µg/m³ PM2.5. Issuing air quality advisory for ${cityName}.` : `AQI within safe limits across all ${cityName} districts.`,
        `Dispatching patrol unit to ${cityName} zone following citizen complaint escalation.`,
        `Coordinating with Energy Agent on ${cityName} power anomaly investigation.`,
        `Incident response time averaging ${Math.round(4 + Math.random() * 6)} minutes across active zones.`,
        "Threat level assessed: LOW. Emergency services on standby.",
      ],
    },
    {
      agent: "Citizen Engagement Agent",
      severity: ticketCount > 3 ? "warning" : "info",
      messages: [
        `${ticketCount} active citizen tickets in queue. Prioritising critical complaints for response.`,
        "Sentiment index updated: Public mood rated MODERATE across central boroughs.",
        "Broadcasting service disruption alert to 12,400 affected commuters via civic portal.",
        "Community proposal feasibility report completed. 3 proposals advanced to Senate review.",
        "Coordinating with Traffic Agent to relay road closure alerts to affected residents.",
      ],
    },
  ];

  const pool = pools[Math.floor(Math.random() * pools.length)];
  const message = pool.messages[Math.floor(Math.random() * pool.messages.length)];

  return { id, agent: pool.agent, severity: pool.severity, message, ts: now };
}

export default function AgentTimeline({ isDarkMode, liveWeather, liveAqi, tickets, cityInfo }) {
  const [events, setEvents] = useState([]);
  const [filterAgent, setFilterAgent] = useState("all");
  const topRef = useRef(null);

  const aqi = liveAqi?.pm2_5 || 0;
  const ticketCount = tickets?.length || 0;
  const cityName = cityInfo?.label || 'City';

  // Seed initial events
  useEffect(() => {
    const initial = [];
    for (let i = 0; i < 6; i++) {
      initial.unshift(generateEvent(liveWeather, aqi, ticketCount, cityName));
    }
    setEvents(initial);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-generate new events
  useEffect(() => {
    const interval = setInterval(() => {
      const newEvent = generateEvent(liveWeather, aqi, ticketCount, cityName);
      setEvents(prev => [newEvent, ...prev].slice(0, 60));
    }, 9000 + Math.random() * 6000);
    return () => clearInterval(interval);
  }, [liveWeather, aqi, ticketCount]);

  const filtered = filterAgent === "all" ? events : events.filter(e => e.agent === filterAgent);

  const handleExportCsv = () => {
    const rows = [
      ["Timestamp", "Agent", "Severity", "Message"],
      ...events.map(e => [
        new Date(e.ts).toISOString(),
        e.agent,
        e.severity,
        `"${e.message.replace(/"/g, "''")}"`,
      ]),
    ];
    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "agent_coordination_log.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const card = {
    background: isDarkMode ? "linear-gradient(135deg,#0f172a,#1e293b)" : "linear-gradient(135deg,#ffffff,#f8fafc)",
    border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    borderRadius: "16px", padding: "20px",
  };

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: isDarkMode ? "#f8fafc" : "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
            <Network className="w-5 h-5" style={{ color: "#6366f1" }} />
            Multi-Agent Coordination Log
          </h2>
          <p style={{ fontSize: "11px", color: isDarkMode ? "#94a3b8" : "#64748b", marginTop: "4px" }}>
            Live feed of AI agent coordination events � auto-updating every 9�15 seconds
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          style={{
            display: "flex", alignItems: "center", gap: "6px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white",
            border: "none", padding: "8px 14px", borderRadius: "8px",
            fontSize: "11px", fontWeight: 700, cursor: "pointer",
            boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
          }}
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "12px" }}>
        {AGENT_NAMES.map(name => {
          const cfg = AGENTS[name];
          const count = events.filter(e => e.agent === name).length;
          const IconComp = cfg.icon;
          return (
            <div key={name} style={{ ...card, padding: "14px", textAlign: "center" }}>
              <IconComp className="w-4 h-4" style={{ color: cfg.color, margin: "0 auto 6px" }} />
              <div style={{ fontSize: "18px", fontWeight: 900, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: "9px", fontWeight: 700, color: isDarkMode ? "#64748b" : "#94a3b8", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                {cfg.short} events
              </div>
            </div>
          );
        })}
      </div>

      {/* Filter */}
      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
        <Filter className="w-3.5 h-3.5" style={{ color: isDarkMode ? "#64748b" : "#94a3b8" }} />
        {["all", ...AGENT_NAMES].map(name => {
          const cfg = AGENTS[name];
          const active = filterAgent === name;
          const color = cfg ? cfg.color : "#6366f1";
          return (
            <button key={name}
              onClick={() => setFilterAgent(name)}
              style={{
                fontSize: "9px", fontWeight: 700, padding: "3px 10px",
                borderRadius: "999px", border: "1px solid",
                cursor: "pointer", textTransform: "uppercase",
                transition: "all 0.15s",
                background: active ? color : (isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                color: active ? "white" : (isDarkMode ? "#94a3b8" : "#64748b"),
                borderColor: active ? color : (isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
              }}
            >
              {name === "all" ? "All Agents" : AGENTS[name].short}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div style={{ ...card, padding: "0", overflow: "hidden" }}>
        <div ref={topRef} />
        <div style={{ maxHeight: "520px", overflowY: "auto", padding: "16px" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: isDarkMode ? "#475569" : "#94a3b8", fontSize: "12px" }}>
              No events for this agent yet.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0" }}>
              {filtered.map((evt, idx) => {
                const cfg = AGENTS[evt.agent] || AGENTS["Citizen Engagement Agent"];
                const sev = SEVERITY_STYLES[evt.severity] || SEVERITY_STYLES.info;
                const IconComp = cfg.icon;
                const isFirst = idx === 0;
                return (
                  <div key={evt.id} style={{ display: "flex", gap: "12px", position: "relative" }}>
                    {/* Timeline line */}
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
                      <div style={{
                        width: "28px", height: "28px", borderRadius: "50%",
                        background: isFirst ? cfg.color : `${cfg.color}20`,
                        border: `2px solid ${cfg.color}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0, zIndex: 1,
                        boxShadow: isFirst ? `0 0 12px ${cfg.color}60` : "none",
                        transition: "all 0.3s",
                      }}>
                        <IconComp className="w-3 h-3" style={{ color: isFirst ? "white" : cfg.color }} />
                      </div>
                      {idx < filtered.length - 1 && (
                        <div style={{
                          width: "2px", flex: 1, minHeight: "24px",
                          background: isDarkMode ? "#1e293b" : "#f1f5f9",
                          margin: "4px 0",
                        }} />
                      )}
                    </div>
                    {/* Event card */}
                    <div style={{
                      flex: 1, paddingBottom: "12px",
                      animation: isFirst ? "fadeSlideIn 0.4s ease-out" : "none",
                    }}>
                      <div style={{
                        borderRadius: "10px",
                        border: `1px solid ${sev.border}`,
                        background: sev.bg,
                        padding: "10px 12px",
                        marginBottom: "2px",
                      }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: cfg.color }}>
                              {evt.agent}
                            </span>
                            <span style={{
                              fontSize: "8px", fontWeight: 700, padding: "1px 5px",
                              borderRadius: "4px", border: `1px solid ${sev.border}`,
                              background: sev.bg, color: sev.color,
                              textTransform: "uppercase",
                            }}>
                              {sev.label}
                            </span>
                          </div>
                          <span style={{ fontSize: "9px", color: isDarkMode ? "#475569" : "#94a3b8", fontWeight: 600 }}>
                            {new Date(evt.ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                          </span>
                        </div>
                        <p style={{ fontSize: "11px", color: isDarkMode ? "#cbd5e1" : "#475569", lineHeight: 1.5, margin: 0 }}>
                          {evt.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
