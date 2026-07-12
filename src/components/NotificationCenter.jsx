import { useState } from "react";
import { X, Bell, ShieldAlert, Wind, Activity, CheckCircle2, ChevronRight } from "lucide-react";

const TYPE_CONFIG = {
  safety: {
    icon: null,
    color: "#f43f5e",
    bg: "rgba(244,63,94,0.08)",
    border: "#f43f5e40",
    label: "Safety",
  },
  environment: {
    icon: null,
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    border: "#10b98140",
    label: "Environment",
  },
  operations: {
    icon: null,
    color: "#6366f1",
    bg: "rgba(99,102,241,0.08)",
    border: "#6366f140",
    label: "Operations",
  },
};

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

const TYPE_ICONS = {
  safety: ShieldAlert,
  environment: Wind,
  operations: Activity,
};

export default function NotificationCenter({ isOpen, onClose, alerts, onMarkRead, onMarkAllRead, isDarkMode }) {
  const [filter, setFilter] = useState("all");
  const unread = alerts.filter((a) => !a.read);
  const filtered = filter === "all" ? alerts : alerts.filter((a) => a.type === filter);

  return (
    <>
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.25)",
            backdropFilter: "blur(2px)",
            zIndex: 9998,
            transition: "opacity 0.2s",
          }}
        />
      )}
      <div
        style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: "360px",
          zIndex: 9999,
          transform: isOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          background: isDarkMode
            ? "linear-gradient(160deg, #0f172a 0%, #1e293b 100%)"
            : "linear-gradient(160deg, #ffffff 0%, #f8fafc 100%)",
          borderLeft: isDarkMode ? "1px solid #1e293b" : "1px solid #e2e8f0",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.18)",
          display: "flex", flexDirection: "column", overflow: "hidden",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "20px",
          borderBottom: isDarkMode ? "1px solid #1e293b" : "1px solid #f1f5f9",
          background: isDarkMode
            ? "linear-gradient(90deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))"
            : "linear-gradient(90deg, rgba(99,102,241,0.06), rgba(139,92,246,0.04))",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{
                width: "36px", height: "36px", borderRadius: "10px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                display: "flex", alignItems: "center", justifyContent: "center",
                boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
              }}>
                <Bell className="w-4 h-4" style={{ color: "white" }} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#1e293b" }}>
                  Alert Center
                </div>
                <div style={{ fontSize: "10px", color: isDarkMode ? "#64748b" : "#94a3b8", fontWeight: 600 }}>
                  {unread.length} unread notification{unread.length !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              {unread.length > 0 && (
                <button
                  onClick={onMarkAllRead}
                  style={{
                    fontSize: "10px", fontWeight: 700, color: "#6366f1",
                    background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)",
                    borderRadius: "6px", padding: "4px 8px", cursor: "pointer",
                  }}
                >
                  Mark all read
                </button>
              )}
              <button
                onClick={onClose}
                style={{
                  width: "28px", height: "28px", borderRadius: "8px",
                  background: isDarkMode ? "#1e293b" : "#f1f5f9",
                  border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isDarkMode ? "#64748b" : "#94a3b8",
                }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["all", "safety", "environment", "operations"].map((f) => {
              const cfg = TYPE_CONFIG[f];
              const activeColor = cfg ? cfg.color : "#6366f1";
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    fontSize: "9px", fontWeight: 700, padding: "3px 8px",
                    borderRadius: "999px", border: "1px solid",
                    cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.05em",
                    transition: "all 0.15s",
                    background: filter === f ? activeColor : (isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                    color: filter === f ? "white" : (isDarkMode ? "#94a3b8" : "#64748b"),
                    borderColor: filter === f ? activeColor : (isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"),
                  }}
                >
                  {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Alerts list */}
        <div style={{ flex: 1, overflowY: "auto", padding: "12px" }}>
          {filtered.length === 0 ? (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center",
              justifyContent: "center", height: "200px", gap: "12px",
              color: isDarkMode ? "#334155" : "#cbd5e1",
            }}>
              <CheckCircle2 className="w-12 h-12" />
              <div style={{ fontSize: "13px", fontWeight: 700, color: isDarkMode ? "#475569" : "#94a3b8" }}>
                All clear!
              </div>
              <div style={{ fontSize: "11px", color: isDarkMode ? "#334155" : "#cbd5e1", textAlign: "center" }}>
                No alerts in this category
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {filtered.map((alert) => {
                const cfg = TYPE_CONFIG[alert.type] || TYPE_CONFIG.operations;
                const IconComp = TYPE_ICONS[alert.type] || Activity;
                return (
                  <div
                    key={alert.id}
                    style={{
                      borderRadius: "12px",
                      border: `1px solid ${alert.read ? (isDarkMode ? "#1e293b" : "#f1f5f9") : cfg.border}`,
                      background: alert.read
                        ? (isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.01)")
                        : cfg.bg,
                      padding: "12px",
                      display: "flex", gap: "10px",
                      position: "relative",
                      transition: "all 0.2s",
                      opacity: alert.read ? 0.5 : 1,
                    }}
                  >
                    {!alert.read && (
                      <div style={{
                        position: "absolute", top: "10px", right: "10px",
                        width: "7px", height: "7px", borderRadius: "50%",
                        background: cfg.color,
                        boxShadow: `0 0 6px ${cfg.color}80`,
                      }} />
                    )}
                    <div style={{
                      width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0,
                      background: `${cfg.color}20`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      color: cfg.color,
                    }}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: 800, color: isDarkMode ? "#f8fafc" : "#1e293b", lineHeight: 1.3 }}>
                          {alert.title}
                        </span>
                        <span style={{ fontSize: "9px", color: isDarkMode ? "#475569" : "#94a3b8", fontWeight: 600, flexShrink: 0 }}>
                          {timeAgo(alert.ts)}
                        </span>
                      </div>
                      <p style={{ fontSize: "10px", marginTop: "3px", color: isDarkMode ? "#94a3b8" : "#64748b", lineHeight: 1.5 }}>
                        {alert.body}
                      </p>
                      {!alert.read && (
                        <button
                          onClick={() => onMarkRead(alert.id)}
                          style={{
                            marginTop: "8px", fontSize: "9px", fontWeight: 700,
                            color: cfg.color, background: "none", border: "none",
                            cursor: "pointer", padding: 0, display: "flex", alignItems: "center", gap: "3px",
                          }}
                        >
                          Dismiss <ChevronRight className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
