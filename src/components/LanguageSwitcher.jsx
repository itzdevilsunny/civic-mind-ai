import { useState, useRef, useEffect } from "react";
import { Globe } from "lucide-react";
import { LANGUAGES } from "../config/i18n";

export default function LanguageSwitcher({ selectedLang, onLangChange, isDarkMode }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const current = LANGUAGES.find(l => l.code === selectedLang) || LANGUAGES[0];

  // Close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const choose = (code) => {
    onLangChange(code);
    localStorage.setItem("civicmind_lang", code);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative", display: "inline-block" }}>
      <button
        onClick={() => setOpen(o => !o)}
        title="Change Language / भाषा बदलें"
        style={{
          display: "flex", alignItems: "center", gap: "5px",
          background: open ? "rgba(99,102,241,0.12)" : "transparent",
          border: "1.5px solid " + (open ? "#6366f1" : "rgba(99,102,241,0.35)"),
          borderRadius: "8px", padding: "4px 9px", cursor: "pointer",
          color: isDarkMode ? "#c7d2fe" : "#4f46e5",
          fontSize: "11px", fontWeight: 700,
          transition: "all 0.2s ease",
          whiteSpace: "nowrap"
        }}
      >
        <Globe size={13} />
        <span style={{ fontFamily: current.font + ", sans-serif", maxWidth: "80px", overflow: "hidden", textOverflow: "ellipsis" }}>
          {current.nativeName}
        </span>
        <span style={{ fontSize: "9px", opacity: 0.6, marginLeft: "1px" }}>▾</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0, zIndex: 99999,
          background: isDarkMode ? "#1e293b" : "#ffffff",
          border: "1.5px solid " + (isDarkMode ? "#334155" : "#e2e8f0"),
          borderRadius: "12px", boxShadow: "0 10px 40px rgba(0,0,0,0.18)",
          padding: "6px", minWidth: "190px",
          maxHeight: "320px", overflowY: "auto"
        }}>
          <div style={{ fontSize: "9px", fontWeight: 700, color: isDarkMode ? "#64748b" : "#94a3b8", padding: "4px 8px 6px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            Select Language • भाषा चुनें
          </div>
          {LANGUAGES.map(lang => {
            const isActive = lang.code === selectedLang;
            return (
              <button
                key={lang.code}
                onClick={() => choose(lang.code)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: "8px", padding: "7px 10px", borderRadius: "8px", border: "none",
                  background: isActive ? "rgba(99,102,241,0.1)" : "transparent",
                  cursor: "pointer",
                  transition: "background 0.15s",
                  direction: lang.dir,
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontFamily: lang.font + ", sans-serif",
                  fontSize: "13px", fontWeight: 700,
                  color: isActive ? "#6366f1" : (isDarkMode ? "#e2e8f0" : "#1e293b")
                }}>
                  {lang.nativeName}
                </span>
                <span style={{ fontSize: "10px", color: isDarkMode ? "#64748b" : "#94a3b8", flexShrink: 0 }}>
                  {lang.name}
                </span>
                {isActive && <span style={{ fontSize: "10px", color: "#6366f1", marginLeft: "auto", flexShrink: 0 }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
