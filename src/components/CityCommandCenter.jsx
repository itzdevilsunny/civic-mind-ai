import { useState, useEffect, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

// Cross-module domain config
const DOMAINS = [
  { key: 'air',    label: 'Air Quality', icon: '💨', color: '#6366f1', endpoint: (c,lat,lng) => `/api/aqi/live?lat=${lat}&lng=${lng}`, extract: d => ({ value: Math.round(d?.current?.pm2_5 ?? 35), unit: 'µg/m³ PM2.5', status: d?.current?.pm2_5 > 75 ? 'Critical' : d?.current?.pm2_5 > 35 ? 'Warning' : 'Good' }) },
  { key: 'water',  label: 'Water',       icon: '💧', color: '#0ea5e9', endpoint: (c) => `/api/water/live?city=${encodeURIComponent(c)}`,   extract: d => ({ value: `${d?.storage_pct ?? 64}%`, unit: 'Reservoir fill', status: (d?.storage_pct ?? 64) < 40 ? 'Critical' : (d?.storage_pct ?? 64) < 60 ? 'Warning' : 'Good' }) },
  { key: 'health', label: 'Health',      icon: '🏥', color: '#ec4899', endpoint: (c) => `/api/health/live?city=${encodeURIComponent(c)}`,   extract: d => ({ value: d?.active_outbreaks ?? 0, unit: 'Active alerts', status: (d?.active_outbreaks ?? 0) > 2 ? 'Critical' : (d?.active_outbreaks ?? 0) > 0 ? 'Warning' : 'Good' }) },
  { key: 'energy', label: 'Solar Grid',  icon: '☀️', color: '#f59e0b', endpoint: (c) => `/api/solar/live?city=${encodeURIComponent(c)}`,    extract: d => ({ value: `${d?.solar_pct ?? 22}%`, unit: 'Solar share', status: (d?.solar_pct ?? 22) > 30 ? 'Good' : (d?.solar_pct ?? 22) > 15 ? 'Warning' : 'Critical' }) },
  { key: 'waste',  label: 'Waste',       icon: '🗑️', color: '#10b981', endpoint: (c) => `/api/waste/telemetry?city=${encodeURIComponent(c)}`, extract: d => ({ value: `${d?.landfill_cap ?? 55}%`, unit: 'Landfill load', status: (d?.landfill_cap ?? 55) >= 80 ? 'Critical' : (d?.landfill_cap ?? 55) >= 60 ? 'Warning' : 'Good' }) },
  { key: 'infra',  label: 'Roads',       icon: '🏗️', color: '#f97316', endpoint: (c) => `/api/infra/telemetry?city=${encodeURIComponent(c)}`, extract: d => ({ value: `${d?.infra_score ?? 55}`, unit: 'Infra score/100', status: (d?.infra_score ?? 55) >= 70 ? 'Good' : (d?.infra_score ?? 55) >= 50 ? 'Warning' : 'Critical' }) },
];

const STATUS_STYLE = {
  Good:     { bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', dot: 'bg-emerald-500', border: 'border-emerald-200 dark:border-emerald-900/40' },
  Warning:  { bg: 'bg-amber-500/10',   text: 'text-amber-600 dark:text-amber-400',     dot: 'bg-amber-500',   border: 'border-amber-200 dark:border-amber-900/40' },
  Critical: { bg: 'bg-rose-500/10',    text: 'text-rose-600 dark:text-rose-400',       dot: 'bg-rose-500',    border: 'border-rose-200 dark:border-rose-900/40' },
};

// Cross-domain correlations: if domainA is status → generate insight for domainB
const CORRELATIONS = [
  { trigger: { key: 'air',    status: ['Warning','Critical'] }, insight: (d) => `🚨 Elevated PM2.5 (${d.air?.value} µg/m³) — High-risk for respiratory patients. Recommend activating Health-Watch outbreak response protocol.`, tabs: ['healthwatch','weather'] },
  { trigger: { key: 'air',    status: ['Critical'] },           insight: (d) => `⛽ Critical AQI detected. Cross-signal: Transit-Eco emissions analysis is now elevated. Trigger vehicle restriction advisories.`, tabs: ['transiteco'] },
  { trigger: { key: 'water',  status: ['Warning','Critical'] }, insight: (d) => `💧 Reservoir at ${d.water?.value} — Activate water rationing protocols. Cross-alert sent to Water-Watch module for demand management.`, tabs: ['waterwatch'] },
  { trigger: { key: 'infra',  status: ['Critical'] },           insight: (d) => `🕳️ Road infra score critically low (${d.infra?.value}/100). High-AQI roads causing accelerated wear. Syncing to Infra-Shield bridge queue.`, tabs: ['infrashield'] },
  { trigger: { key: 'waste',  status: ['Critical'] },           insight: (d) => `🗑️ Landfill at ${d.waste?.value} — CRITICAL. Emergency diversion order required. Cross-impact on air quality: landfill methane contributes to AQI degradation.`, tabs: ['wastenet','weather'] },
  { trigger: { key: 'health', status: ['Warning','Critical'] }, insight: (d) => `🏥 ${d.health?.value} active health alerts. Correlating with current AQI (${d.air?.value} µg/m³) — respiratory alert. Dispatch Health-Watch epidemiology team.`, tabs: ['healthwatch'] },
  { trigger: { key: 'energy', status: ['Critical'] },           insight: (d) => `☀️ Solar grid share at ${d.energy?.value} — below 15%. Grid stress likely. Cross-impact: water pump stations may face load-shedding. Check Water-Watch.`, tabs: ['waterwatch','urjagrid'] },
];

function useLiveDomains(city, lat, lng) {
  const [domainData, setDomainData] = useState({});
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const intervalRef = useRef(null);

  const fetchAll = useCallback(async () => {
    const results = {};
    await Promise.allSettled(
      DOMAINS.map(async (dom) => {
        try {
          const res = await fetch(dom.endpoint(city, lat, lng));
          if (!res.ok) throw new Error('API Error');
          const json = await res.json();
          results[dom.key] = { raw: json, ...dom.extract(json) };
        } catch {
          // use static fallback
          results[dom.key] = dom.extract(null);
        }
      })
    );
    setDomainData(results);
    setLastUpdate(new Date());
    setLoading(false);
  }, [city, lat, lng]);

  useEffect(() => {
    fetchAll();
    intervalRef.current = setInterval(fetchAll, 60000); // refresh every 60s
    return () => clearInterval(intervalRef.current);
  }, [fetchAll]);

  return { domainData, loading, lastUpdate, refetch: fetchAll };
}

export default function CityCommandCenter({
  city, lat, lng, liveWeather, liveAqi, liveTransport, liveMarket, liveNews,
  getCityRadarOption, getAIDiagnosisSummary, getMarketChartOption,
  cityInfo, isDarkMode, setActiveTab
}) {
  const { domainData, loading, lastUpdate, refetch } = useLiveDomains(city, lat, lng);
  const [tick, setTick] = useState(0);
  const [expandedInsight, setExpandedInsight] = useState(null);

  // Live clock tick
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Derive active correlations
  const activeCorrelations = CORRELATIONS.filter(c =>
    c.trigger.status.includes(domainData[c.trigger.key]?.status)
  );

  // Compute city health score (0-100) from domain statuses
  const scoreMap = { Good: 100, Warning: 55, Critical: 20 };
  const domainScores = DOMAINS.map(d => scoreMap[domainData[d.key]?.status] ?? 70);
  const cityHealthScore = Math.round(domainScores.reduce((a,b) => a+b, 0) / DOMAINS.length);
  const healthColor = cityHealthScore >= 80 ? '#10b981' : cityHealthScore >= 55 ? '#f59e0b' : '#ef4444';
  const healthGrade = cityHealthScore >= 80 ? 'Healthy' : cityHealthScore >= 55 ? 'At Risk' : 'Critical';

  // 24h sparkline data for radar
  const radarOption = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: DOMAINS.map(d => ({ name: d.label, max: 100 })),
      shape: 'polygon', splitNumber: 3,
      axisName: { color: '#94a3b8', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(99,102,241,0.08)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(99,102,241,0.08)' } }
    },
    series: [{
      type: 'radar',
      data: [{
        value: DOMAINS.map(d => scoreMap[domainData[d.key]?.status] ?? 70),
        name: 'City Health',
        areaStyle: { color: 'rgba(99,102,241,0.12)' },
        lineStyle: { color: '#6366f1', width: 2 },
        itemStyle: { color: '#6366f1' }
      }]
    }]
  };

  // Market sparkline (reuse from parent)
  const aqi = liveAqi?.current?.pm2_5 ?? 35;
  const aqiColor = aqi > 100 ? '#ef4444' : aqi > 55 ? '#f59e0b' : '#10b981';
  const temp = liveWeather?.current?.temperature_2m;
  const humidity = liveWeather?.current?.relative_humidity_2m;
  const precip = liveWeather?.current?.precipitation;

  const now = new Date();
  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="flex flex-col gap-5">

      {/* ── COMMAND ROW: City Score + Live Clock + Quick Refresh ── */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* City Health Score Arc */}
        <div className="card p-4 flex items-center gap-4 lg:col-span-1">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
              <circle cx="40" cy="40" r="34" fill="none" stroke="#f1f5f9" strokeWidth="7" />
              <circle cx="40" cy="40" r="34" fill="none" stroke={healthColor} strokeWidth="7"
                strokeDasharray={`${cityHealthScore * 2.14} 214`} strokeLinecap="round"
                className="transition-all duration-700" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-base font-black" style={{ color: healthColor }}>{cityHealthScore}</span>
              <span className="text-[8px] text-slate-400">/100</span>
            </div>
          </div>
          <div className="flex flex-col gap-0.5">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">City Health</div>
            <div className="text-sm font-extrabold" style={{ color: healthColor }}>{healthGrade}</div>
            <div className="text-[10px] text-slate-400">Last refresh: {lastUpdate ? lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}</div>
            <button onClick={refetch} className="text-[10px] text-indigo-500 hover:text-indigo-700 font-bold cursor-pointer mt-1 text-left flex items-center gap-1" title="Refresh all domains">
              ↻ Refresh now
            </button>
          </div>
        </div>

        {/* Live weather stats */}
        <div className="card p-4 lg:col-span-2 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">☁️ Live Weather · {cityInfo?.label || city}</span>
            <span className="text-[10px] font-mono text-indigo-500 font-bold">{timeStr}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Temp', value: temp ? `${temp}°C` : '—', sub: liveWeather?.current?.apparent_temperature ? `Feels ${liveWeather.current.apparent_temperature}°C` : '', color: 'text-indigo-600 dark:text-indigo-400' },
              { label: 'Wind', value: liveWeather?.current?.wind_speed_10m ? `${liveWeather.current.wind_speed_10m} km/h` : '—', sub: `Dir: ${liveWeather?.current?.wind_direction_10m ?? '—'}°`, color: 'text-emerald-600 dark:text-emerald-400' },
              { label: 'Humidity', value: humidity ? `${humidity}%` : '—', sub: `Precip: ${precip ?? 0}mm`, color: 'text-amber-500' },
              { label: 'AQI PM2.5', value: `${aqi} µg/m³`, sub: `PM10: ${liveAqi?.current?.pm10 ?? '—'} µg/m³`, color: aqi > 75 ? 'text-rose-500' : aqi > 35 ? 'text-amber-500' : 'text-emerald-500' }
            ].map((w, i) => (
              <div key={i} className="flex flex-col gap-0.5">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{w.label}</span>
                <span className={`text-sm font-extrabold font-mono ${w.color}`}>{w.value}</span>
                <span className="text-[9px] text-slate-400">{w.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Live Market ticker */}
        <div className="card p-4 flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">📈 Market</span>
          {liveMarket ? (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-slate-400">{liveMarket.label || 'Nifty 50'}</span>
                <span className="text-base font-extrabold font-mono text-indigo-600 dark:text-indigo-400">{liveMarket.price?.toLocaleString('en-IN') || '—'}</span>
                <span className={`text-[10px] font-bold ${(liveMarket.changePct || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {(liveMarket.changePct || 0) >= 0 ? '▲' : '▼'} {Math.abs(liveMarket.changePct || 0).toFixed(2)}%
                </span>
              </div>
              {liveMarket.secondary && (
                <div className="flex flex-col gap-0.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <span className="text-[9px] text-slate-400">{liveMarket.secondary.label}</span>
                  <span className="text-xs font-bold font-mono text-slate-700 dark:text-slate-300">{liveMarket.secondary.price?.toLocaleString('en-IN')}</span>
                  <span className={`text-[10px] font-bold ${(liveMarket.secondary.changePct || 0) >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                    {(liveMarket.secondary.changePct || 0) >= 0 ? '▲' : '▼'} {Math.abs(liveMarket.secondary.changePct || 0).toFixed(2)}%
                  </span>
                </div>
              )}
            </>
          ) : (
            <span className="text-[10px] text-slate-400">Loading market data…</span>
          )}
        </div>
      </div>

      {/* ── DOMAIN CARDS: 6 live-updated module cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {DOMAINS.map(dom => {
          const d = domainData[dom.key];
          const status = d?.status ?? 'Good';
          const st = STATUS_STYLE[status];
          return (
            <button
              key={dom.key}
              onClick={() => setActiveTab(dom.key === 'air' ? 'weather' : dom.key === 'energy' ? 'urjagrid' : dom.key === 'waste' ? 'wastenet' : dom.key === 'infra' ? 'infrashield' : dom.key + 'watch')}
              className={`card p-3 flex flex-col gap-2 cursor-pointer hover:scale-105 transition-all duration-200 border ${st.border} text-left`}
              title={`Go to ${dom.label}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-lg">{dom.icon}</span>
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${st.bg} ${st.text}`}>{status}</span>
              </div>
              <div>
                <div className="text-base font-extrabold" style={{ color: dom.color }}>
                  {loading ? <span className="animate-pulse text-slate-300">…</span> : (d?.value ?? '—')}
                </div>
                <div className="text-[10px] text-slate-400">{d?.unit ?? dom.label}</div>
              </div>
              <div className="text-[9px] font-bold text-indigo-400 mt-auto">→ {dom.label}</div>
            </button>
          );
        })}
      </div>

      {/* ── CROSS-DOMAIN CORRELATION ALERTS ── */}
      {activeCorrelations.length > 0 && (
        <div className="card p-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm">🔗</span>
            <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">Cross-Domain AI Correlations</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 font-bold">{activeCorrelations.length} active</span>
          </div>
          <div className="flex flex-col gap-2">
            {activeCorrelations.map((c, i) => (
              <div key={i}
                className="flex items-start gap-3 p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors"
                onClick={() => { setExpandedInsight(expandedInsight === i ? null : i); }}
              >
                <div className="flex-1 text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">
                  {c.insight(domainData)}
                </div>
                <div className="flex flex-col gap-1 items-end flex-shrink-0">
                  {c.tabs.map(tab => (
                    <button key={tab}
                      onClick={(e) => { e.stopPropagation(); setActiveTab(tab); }}
                      className="text-[9px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 hover:bg-indigo-500/25 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      → {tab}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── CIVIC HEALTH RADAR + AI DIAGNOSIS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="card lg:col-span-1 flex flex-col items-center gap-3 py-4">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-2 w-full">
            <h3 className="card-title">🕸️ Civic Health Radar</h3>
            <span className="card-subtitle">Multi-domain real-time city score</span>
          </div>
          <ReactECharts option={radarOption} style={{ height: 220, width: '100%' }} />
          <div className="grid grid-cols-3 gap-2 w-full">
            {DOMAINS.map(d => {
              const s = domainData[d.key]?.status ?? 'Good';
              return (
                <div key={d.key} className={`flex items-center gap-1 text-[10px] font-bold ${STATUS_STYLE[s].text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${STATUS_STYLE[s].dot} flex-shrink-0`} />
                  {d.label}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card lg:col-span-2 flex flex-col gap-4">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="card-title">🤖 AI Operational Diagnosis</h3>
            <span className="card-subtitle">Gemini real-time multi-domain civic health synthesis</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
            {getAIDiagnosisSummary ? getAIDiagnosisSummary() :
              `City intelligence synthesis: ${activeCorrelations.length > 0 ? `${activeCorrelations.length} cross-domain alerts active.` : 'All domains nominal.'} AQI at ${aqi} µg/m³ ${aqi > 55 ? '— elevated, health protocols recommended.' : '— within safe limits.'} ${liveTransport?.filter(l => l.lineStatuses?.[0]?.statusSeverityDescription !== 'Good Service').length > 0 ? 'Transit disruptions detected.' : 'Transit nominal.'}`
            }
          </p>
          {/* Connected module status grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
            {DOMAINS.map(dom => {
              const d = domainData[dom.key];
              const s = d?.status ?? 'Good';
              const st = STATUS_STYLE[s];
              return (
                <div key={dom.key} className={`flex items-center gap-2 p-2 rounded-lg border ${st.border} ${st.bg}`}>
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${st.dot} ${s === 'Critical' ? 'animate-pulse' : ''}`} />
                  <div className="flex flex-col min-w-0">
                    <span className={`text-[10px] font-bold ${st.text}`}>{dom.label}</span>
                    <span className="text-[9px] text-slate-400 truncate">{d?.value ?? '—'} {d?.unit ?? ''}</span>
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-auto p-3 bg-indigo-50/30 dark:bg-indigo-950/20 border border-indigo-200/40 dark:border-indigo-900/30 rounded-xl flex justify-between items-center text-[10px] font-mono text-indigo-600 dark:text-indigo-400">
            <span>COORDINATOR: ACTIVE · {DOMAINS.length} DOMAINS MONITORED</span>
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              LIVE SYNC
            </span>
          </div>
        </div>
      </div>

      {/* ── TRANSIT STATUS + NEWS ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Transit Status */}
        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <h3 className="card-title">🚇 {cityInfo?.label || city} Transit</h3>
            <span className="card-subtitle">Live line statuses</span>
          </div>
          <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto">
            {liveTransport && liveTransport.length > 0 ? liveTransport.map(line => {
              const status = line.lineStatuses[0]?.statusSeverityDescription || 'Good Service';
              const isGood = status === 'Good Service';
              const isWarn = status.includes('Delay') || status.includes('Reduced');
              const bc = isGood ? 'status-good' : isWarn ? 'status-warning' : 'status-danger';
              return (
                <div key={line.id} className="transport-line-item">
                  <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{line.name}</span>
                  <span className={`status-badge ${bc}`}>{status}</span>
                </div>
              );
            }) : (
              ['Metro Blue', 'Metro Red', 'BRTS Corridor', 'City Bus Express', 'Rail Link'].map(l => (
                <div key={l} className="transport-line-item">
                  <span className="font-bold text-xs">{l}</span>
                  <span className="status-badge status-good">Good Service</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Market mini-chart */}
        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <h3 className="card-title">📈 Nifty 50 · Sensex</h3>
            <span className="card-subtitle">Intraday performance</span>
          </div>
          <div className="h-[200px]">
            <ReactECharts option={getMarketChartOption ? getMarketChartOption() : {}} style={{ height: '100%', width: '100%' }} />
          </div>
        </div>

        {/* News feed */}
        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-3">
            <h3 className="card-title">📰 Live News</h3>
            <span className="card-subtitle">{cityInfo?.label || city} latest</span>
          </div>
          <div className="flex flex-col gap-2.5 max-h-[220px] overflow-y-auto">
            {liveNews?.articles?.slice(0, 4).map((art, i) => (
              <a key={i} href={art.link} target="_blank" rel="noopener noreferrer"
                className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors block">
                <div className="font-bold text-xs text-slate-800 dark:text-slate-200 line-clamp-2 leading-tight">{art.title}</div>
                <div className="text-[9px] text-slate-400 mt-1">{art.pubDate}</div>
              </a>
            )) || (
              <div className="text-xs text-slate-400">Loading {cityInfo?.label || city} news feed…</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
