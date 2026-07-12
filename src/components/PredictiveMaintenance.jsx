import { useState, useEffect, useRef } from "react";
import { AlertTriangle, CheckCircle, Clock, Loader2, RefreshCw } from "lucide-react";

const PRIORITY_STYLES = {
  Immediate: { color: "#f43f5e", bg: "rgba(244,63,94,0.1)", border: "#f43f5e40", icon: AlertTriangle },
  Soon:      { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "#f59e0b40", icon: Clock      },
  Scheduled: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "#10b98140", icon: CheckCircle },
};

function AnimatedRing({ score, color, size = 80 }) {
  const [displayed, setDisplayed] = useState(0);
  const circumference = 2 * Math.PI * 32;

  useEffect(() => {
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setDisplayed(Math.min(i, score));
      if (i >= score) clearInterval(timer);
    }, 20);
    return () => clearInterval(timer);
  }, [score]);

  return (
    <svg width={size} height={size} viewBox="0 0 80 80">
      <circle cx="40" cy="40" r="32" fill="none" stroke="#334155" strokeWidth="8" />
      <circle
        cx="40" cy="40" r="32" fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${(displayed / 100) * circumference} ${circumference}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.05s", filter: `drop-shadow(0 0 4px ${color}80)` }}
        transform="rotate(-90 40 40)"
      />
      <text x="40" y="43" textAnchor="middle" fontSize="14" fontWeight="900" fill={color}>{displayed}</text>
      <text x="40" y="54" textAnchor="middle" fontSize="8" fill="#64748b">RISK%</text>
    </svg>
  );
}

export default function PredictiveMaintenance({ isDarkMode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const intervalRef = useRef(null);

  const fetchForecast = () => {
    setLoading(true);
    fetch("/api/maintenance/forecast")
      .then(r => r.json())
      .then(d => { setData(d); setLastUpdated(new Date().toLocaleTimeString()); })
      .catch(err => console.error("Maintenance forecast error:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchForecast();
    intervalRef.current = setInterval(fetchForecast, 120000);
    return () => clearInterval(intervalRef.current);
  }, []);

  const card = {
    background: isDarkMode ? "linear-gradient(135deg,#0f172a,#1e293b)" : "linear-gradient(135deg,#ffffff,#f8fafc)",
    border: isDarkMode ? "1px solid #334155" : "1px solid #e2e8f0",
    borderRadius: "16px", padding: "20px",
  };

  const headingColor = isDarkMode ? "#f8fafc" : "#1e293b";
  const textColor = isDarkMode ? "#cbd5e1" : "#475569";
  const labelColor = isDarkMode ? "#94a3b8" : "#64748b";

  return (
    <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 900, color: headingColor, display: "flex", alignItems: "center", gap: "8px" }}>
            ?? Predictive Maintenance Intelligence
          </h2>
          <p style={{ fontSize: "11px", color: labelColor, marginTop: "4px" }}>
            AI-powered infrastructure risk forecasting based on live ticket patterns
            {lastUpdated && <span style={{ marginLeft: "8px", color: "#6366f1" }}>� Updated {lastUpdated}</span>}
          </p>
        </div>
        <button onClick={fetchForecast} disabled={loading} style={{
          background: "linear-gradient(135deg,#6366f1,#8b5cf6)", color: "white", border: "none",
          padding: "8px 14px", borderRadius: "8px", fontSize: "11px", fontWeight: 700,
          cursor: "pointer", display: "flex", alignItems: "center", gap: "6px",
          opacity: loading ? 0.7 : 1,
          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
        }}>
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          {loading ? "Analyzing..." : "Refresh Forecast"}
        </button>
      </div>

      {loading && !data && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 0", gap: "16px" }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: "#6366f1" }} />
          <p style={{ fontSize: "13px", color: labelColor }}>Gemini AI is analyzing infrastructure risk patterns...</p>
        </div>
      )}

      {data && (
        <>
          {/* Risk Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "16px" }}>
            {data.assets?.map(asset => {
              const p = PRIORITY_STYLES[asset.priority] || PRIORITY_STYLES.Scheduled;
              const PIcon = p.icon;
              return (
                <div key={asset.category} style={{
                  ...card,
                  border: `1px solid ${p.border}`,
                  background: isDarkMode ? `linear-gradient(135deg,#0f172a,${p.bg})` : `linear-gradient(135deg,#ffffff,${p.bg})`,
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                    <div>
                      <div style={{ fontSize: "18px", marginBottom: "2px" }}>{asset.emoji}</div>
                      <div style={{ fontSize: "11px", fontWeight: 800, color: headingColor, lineHeight: 1.2 }}>{asset.category}</div>
                      <div style={{ fontSize: "9px", color: labelColor, marginTop: "2px" }}>
                        {asset.open_tickets} open / {asset.total_tickets} total tickets
                      </div>
                    </div>
                    <AnimatedRing score={asset.risk_score} color={p.color} size={72} />
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <PIcon className="w-3.5 h-3.5" style={{ color: p.color }} />
                    <span style={{
                      fontSize: "9px", fontWeight: 800, padding: "2px 7px",
                      borderRadius: "999px", border: `1px solid ${p.border}`,
                      background: p.bg, color: p.color, textTransform: "uppercase",
                    }}>
                      {asset.priority}
                    </span>
                  </div>

                  <div style={{
                    padding: "8px 10px", borderRadius: "8px",
                    background: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                    border: isDarkMode ? "1px solid #1e293b" : "1px solid #f1f5f9",
                  }}>
                    <div style={{ fontSize: "9px", color: labelColor, fontWeight: 600 }}>Est. days to failure risk</div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: p.color }}>{asset.days_to_failure} <span style={{ fontSize: "10px", fontWeight: 600, color: labelColor }}>days</span></div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* AI Remediation Recommendations */}
          {data.recommendations?.length > 0 && (
            <div style={card}>
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "13px", fontWeight: 800, color: headingColor }}>
                  ?? Gemini AI Pre-emptive Remediation Plan
                </div>
                <div style={{ fontSize: "10px", color: labelColor, marginTop: "3px" }}>
                  Actionable maintenance steps ranked by savings potential vs reactive repair cost
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "12px" }}>
                {data.recommendations.map((rec, idx) => (
                  <div key={idx} style={{
                    padding: "14px",
                    borderRadius: "12px",
                    background: isDarkMode ? "rgba(99,102,241,0.08)" : "rgba(99,102,241,0.04)",
                    border: isDarkMode ? "1px solid rgba(99,102,241,0.2)" : "1px solid rgba(99,102,241,0.12)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                      <div style={{
                        width: "22px", height: "22px", borderRadius: "50%",
                        background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: "10px", fontWeight: 900, color: "white",
                      }}>{idx + 1}</div>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#6366f1" }}>{rec.category}</span>
                    </div>
                    <p style={{ fontSize: "11px", color: textColor, lineHeight: 1.5, marginBottom: "8px" }}>{rec.action}</p>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px" }}>
                      <span style={{ color: "#10b981", fontWeight: 700 }}>?? Saves {rec.savings_estimate}</span>
                      <span style={{ color: labelColor, fontWeight: 600 }}>{rec.timeline}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Maintenance Schedule Timeline */}
          <div style={card}>
            <div style={{ fontSize: "13px", fontWeight: 800, color: headingColor, marginBottom: "14px" }}>
              ?? 30-Day Maintenance Schedule
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {data.assets?.map(asset => {
                const p = PRIORITY_STYLES[asset.priority] || PRIORITY_STYLES.Scheduled;
                const barWidth = Math.min(100, (asset.days_to_failure / 60) * 100);
                return (
                  <div key={asset.category} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div style={{ width: "130px", fontSize: "10px", fontWeight: 700, color: textColor, flexShrink: 0 }}>
                      {asset.emoji} {asset.category.split(" ")[0]}
                    </div>
                    <div style={{ flex: 1, height: "8px", borderRadius: "999px", background: isDarkMode ? "#1e293b" : "#f1f5f9", overflow: "hidden" }}>
                      <div style={{
                        width: `${100 - barWidth}%`, height: "100%",
                        background: `linear-gradient(90deg, ${p.color}, ${p.color}80)`,
                        borderRadius: "999px",
                        transition: "width 1s ease",
                      }} />
                    </div>
                    <div style={{ width: "55px", fontSize: "9px", fontWeight: 700, color: p.color, textAlign: "right", flexShrink: 0 }}>
                      Day {asset.days_to_failure}
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: "10px", fontSize: "9px", color: labelColor }}>
              Bar fill = urgency proximity. Shorter bar = further maintenance window. Red = Immediate action required.
            </div>
          </div>
        </>
      )}
    </div>
  );
}
