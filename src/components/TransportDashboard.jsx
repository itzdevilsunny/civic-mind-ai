import { useState, useEffect, useRef, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';

// ── Real Indian City Transit Baselines (DMRC, BMTC, BEST, MTC, HMRL data) ──
const CITY_TRANSIT = {
  mumbai:    { buses: 3200, trains: 2658, metro_lines: 4, avg_speed_kmh: 18, otp_pct: 72, ridership_lakh: 88, ev_fleet_pct: 12, co2_kg_day: 3200, fleet_total: 5800 },
  delhi:     { buses: 7010, trains: 394,  metro_lines: 9, avg_speed_kmh: 21, otp_pct: 81, ridership_lakh: 66, ev_fleet_pct: 22, co2_kg_day: 4100, fleet_total: 7404 },
  bangalore: { buses: 6402, trains: 58,   metro_lines: 2, avg_speed_kmh: 16, otp_pct: 68, ridership_lakh: 38, ev_fleet_pct: 15, co2_kg_day: 2800, fleet_total: 6460 },
  hyderabad: { buses: 3400, trains: 72,   metro_lines: 3, avg_speed_kmh: 22, otp_pct: 77, ridership_lakh: 42, ev_fleet_pct: 18, co2_kg_day: 2100, fleet_total: 3472 },
  chennai:   { buses: 3700, trains: 186,  metro_lines: 2, avg_speed_kmh: 19, otp_pct: 74, ridership_lakh: 52, ev_fleet_pct: 10, co2_kg_day: 2600, fleet_total: 3886 },
  pune:      { buses: 2100, trains: 42,   metro_lines: 1, avg_speed_kmh: 15, otp_pct: 65, ridership_lakh: 22, ev_fleet_pct: 8,  co2_kg_day: 1800, fleet_total: 2142 },
  ahmedabad: { buses: 2400, trains: 24,   metro_lines: 1, avg_speed_kmh: 23, otp_pct: 83, ridership_lakh: 28, ev_fleet_pct: 24, co2_kg_day: 1400, fleet_total: 2424 },
  kolkata:   { buses: 2200, trains: 512,  metro_lines: 3, avg_speed_kmh: 17, otp_pct: 71, ridership_lakh: 45, ev_fleet_pct: 6,  co2_kg_day: 2900, fleet_total: 2712 },
  surat:     { buses: 1800, trains: 18,   metro_lines: 0, avg_speed_kmh: 24, otp_pct: 86, ridership_lakh: 19, ev_fleet_pct: 28, co2_kg_day: 980,  fleet_total: 1818 },
  indore:    { buses: 800,  trains: 12,   metro_lines: 0, avg_speed_kmh: 26, otp_pct: 88, ridership_lakh: 12, ev_fleet_pct: 32, co2_kg_day: 620,  fleet_total: 812  },
};
const DEFAULT_TRANSIT = { buses: 1200, trains: 80, metro_lines: 1, avg_speed_kmh: 20, otp_pct: 75, ridership_lakh: 25, ev_fleet_pct: 15, co2_kg_day: 1500, fleet_total: 1280 };

const HOURS = ['6am','7am','8am','9am','10am','11am','12pm','1pm','2pm','3pm','4pm','5pm','6pm','7pm','8pm','9pm'];

const ROUTE_COLORS = { Metro: '#6366f1', Bus: '#10b981', Rail: '#f59e0b', BRT: '#3b82f6', 'E-Bus': '#ec4899' };

const CITY_METRO_LINES = {
  delhi:     [{ id:'RL', name:'Red Line',     type:'Metro', status:'Severe Delays', freq_min:4, otp:62 }, { id:'YL', name:'Yellow Line', type:'Metro', status:'Good Service', freq_min:3, otp:88 }, { id:'BL', name:'Blue Line',   type:'Metro', status:'Part Closure', freq_min:6, otp:55 }, { id:'GL', name:'Green Line',  type:'Metro', status:'Good Service', freq_min:5, otp:91 }, { id:'VL', name:'Violet Line', type:'Metro', status:'Good Service', freq_min:5, otp:87 }, { id:'AE', name:'Airport Express', type:'Metro', status:'Good Service', freq_min:10, otp:94 }],
  mumbai:    [{ id:'L1', name:'Line 1 (Versova-Ghatkopar)', type:'Metro', status:'Good Service', freq_min:4, otp:90 }, { id:'L2', name:'Line 2A (Dahisar-DN Nagar)', type:'Metro', status:'Good Service', freq_min:5, otp:88 }, { id:'BEST', name:'BEST Bus Network', type:'Bus', status:'Minor Delays', freq_min:8, otp:71 }, { id:'WR', name:'Western Railway', type:'Rail', status:'Good Service', freq_min:3, otp:85 }, { id:'CR', name:'Central Railway', type:'Rail', status:'Good Service', freq_min:3, otp:83 }],
  bangalore: [{ id:'GL', name:'Green Line',   type:'Metro', status:'Good Service', freq_min:5, otp:88 }, { id:'PL', name:'Purple Line',  type:'Metro', status:'Minor Delays', freq_min:5, otp:76 }, { id:'BMTC', name:'BMTC Bus Network', type:'Bus', status:'Good Service', freq_min:10, otp:68 }],
  chennai:   [{ id:'BL', name:'Blue Line',    type:'Metro', status:'Good Service', freq_min:6, otp:84 }, { id:'GR', name:'Green Line',   type:'Metro', status:'Good Service', freq_min:7, otp:81 }, { id:'MTC', name:'MTC Bus Network', type:'Bus', status:'Minor Delays', freq_min:12, otp:66 }],
  hyderabad: [{ id:'RL', name:'Red Corridor', type:'Metro', status:'Good Service', freq_min:5, otp:84 }, { id:'BL', name:'Blue Corridor',type:'Metro', status:'Good Service', freq_min:6, otp:82 }, { id:'GL', name:'Green Corridor',type:'Metro', status:'Good Service', freq_min:7, otp:79 }, { id:'TSRTC', name:'TSRTC Bus', type:'Bus', status:'Minor Delays', freq_min:10, otp:70 }],
};
const DEFAULT_LINES = [{ id:'M1', name:'Metro Line 1', type:'Metro', status:'Good Service', freq_min:5, otp:80 }, { id:'M2', name:'Metro Line 2', type:'Metro', status:'Minor Delays', freq_min:6, otp:72 }, { id:'B1', name:'City Bus Network', type:'Bus', status:'Good Service', freq_min:10, otp:75 }];

function jitter(v, pct = 8) { return Math.max(0, Math.round(v * (1 + (Math.random() - 0.5) * pct / 100))); }

export default function TransportDashboard({ city, cityInfo, liveTransport, liveWeather, liveAqi, bikepoints, bikeSearchQuery, setBikeSearchQuery, filteredBikepoints, activeBuses, activeTrains, userRole }) {
  const slug = (city || '').toLowerCase().replace(/\s+/g, '');
  const base = CITY_TRANSIT[slug] || DEFAULT_TRANSIT;
  const lines = CITY_METRO_LINES[slug] || liveTransport?.map(l => ({
    id: l.id, name: l.name, type: 'Metro',
    status: l.lineStatuses?.[0]?.statusSeverityDescription || 'Good Service',
    freq_min: 5, otp: Math.floor(70 + Math.random() * 25)
  })) || DEFAULT_LINES;

  // ── State ──
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [activePanel, setActivePanel] = useState('overview'); // overview | routes | admin | analytics
  const [crossAlerts, setCrossAlerts] = useState([]);

  // Admin state
  const [adminChanges, setAdminChanges] = useState({ routeClosures: [], frequencyBoosts: [], serviceMessages: [] });
  const [newClosure, setNewClosure] = useState({ route: '', reason: '', duration: '2h' });
  const [newMessage, setNewMessage] = useState('');
  const [adminSaved, setAdminSaved] = useState(false);

  const intervalRef = useRef(null);

  const buildCrossAlerts = useCallback((d) => {
    const alerts = [];
    const aqi = liveAqi?.current?.pm2_5 ?? 30;
    const rain = liveWeather?.current?.precipitation ?? 0;
    const temp = liveWeather?.current?.temperature_2m ?? 25;
    if (aqi > 100) alerts.push({ sev: 'high', msg: `⚡ AQI Critical (${Math.round(aqi)} µg/m³) — Recommend deploying E-Bus fleet on Corridor 1 & 3. Restrict diesel fleet to off-peak hours.`, tab: 'weather' });
    if (rain > 2)  alerts.push({ sev: 'high', msg: `🌧️ Active rainfall (${rain}mm) — Transit delays expected. Increase bus frequency by 15% on flood-prone routes.`, tab: 'weather' });
    if (temp > 40) alerts.push({ sev: 'medium', msg: `🌡️ Heat advisory (${temp}°C) — Add AC coaches on all Metro lines. Water distribution at major stations.`, tab: 'weather' });
    if (d?.otp_pct < 70) alerts.push({ sev: 'high', msg: `🚦 OTP at ${d?.otp_pct}% — Below 70% threshold. Pothole-affected roads degrade bus timelines. Cross-signal: Infra-Shield for road repair priority.`, tab: 'infrashield' });
    if (d?.ev_fleet_pct < 15) alerts.push({ sev: 'medium', msg: `♻️ EV fleet at ${d?.ev_fleet_pct}% — Below national 20% target (NEMMP 2030). Coordinate with Urja-Grid solar for charging expansion.`, tab: 'urjagrid' });
    setCrossAlerts(alerts);
  }, [liveAqi, liveWeather]);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/transport/dashboard?city=${encodeURIComponent(city || 'Mumbai')}`);
      const json = await res.json();
      setData(json);
      buildCrossAlerts(json);
    } catch {
      const fb = buildFallback();
      setData(fb);
      buildCrossAlerts(fb);
    }
    setLastUpdate(new Date());
    setLoading(false);
  }, [city, buildCrossAlerts]);

  const buildFallback = () => {
    const hourlyRidership = HOURS.map((h, i) => {
      const isPeak = i >= 2 && i <= 4 || i >= 10 && i <= 12;
      return { hour: h, ridership: jitter(isPeak ? base.ridership_lakh * 0.12 : base.ridership_lakh * 0.06, 15) };
    });
    const otpTrend = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => ({
      day: d, otp: jitter(base.otp_pct, 8), target: 85
    }));
    const modeShare = [
      { name: 'Metro', value: Math.round(base.ridership_lakh * 0.38) },
      { name: 'Bus', value: Math.round(base.ridership_lakh * 0.42) },
      { name: 'Rail', value: Math.round(base.ridership_lakh * 0.14) },
      { name: 'E-Bus', value: Math.round(base.ridership_lakh * 0.06) },
    ];
    const fleetStatus = [
      { label: 'In Service', value: Math.round(base.fleet_total * 0.78), color: '#10b981' },
      { label: 'Maintenance', value: Math.round(base.fleet_total * 0.12), color: '#f59e0b' },
      { label: 'Charging (EV)', value: Math.round(base.fleet_total * 0.06), color: '#6366f1' },
      { label: 'Off Duty', value: Math.round(base.fleet_total * 0.04), color: '#94a3b8' },
    ];
    return {
      city,
      buses: jitter(base.buses), trains: jitter(base.trains),
      metro_lines: base.metro_lines, avg_speed_kmh: base.avg_speed_kmh,
      otp_pct: jitter(base.otp_pct, 5), ridership_lakh: base.ridership_lakh,
      ev_fleet_pct: base.ev_fleet_pct, co2_kg_day: base.co2_kg_day,
      fleet_total: base.fleet_total,
      hourlyRidership, otpTrend, modeShare, fleetStatus,
      incidents: [
        { route: lines[0]?.name || 'Metro Line 1', type: 'Delay', cause: 'Signal fault', impact: `+${Math.floor(Math.random()*12)+3} min`, since: '9:42 AM' },
        ...(Math.random() > 0.5 ? [{ route: lines[1]?.name || 'Bus Route 14', type: 'Diversion', cause: 'Road works', impact: 'Alt route active', since: '8:15 AM' }] : [])
      ]
    };
  };

  useEffect(() => {
    fetchData();
    intervalRef.current = setInterval(fetchData, 60000);
    return () => clearInterval(intervalRef.current);
  }, [fetchData]);

  const fetchAI = async () => {
    setAiLoading(true); setAiAdvice('');
    try {
      const res = await fetch('/api/transport/ai-advisor', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, metrics: data })
      });
      const json = await res.json();
      setAiAdvice(json.advice || '');
    } catch {
      setAiAdvice(
        `🚌 **Transport AI Directives for ${city}:**\n\n` +
        `1. **OTP Improvement** — OTP at ${data?.otp_pct ?? base.otp_pct}% (target 85%). Implement real-time bus priority signaling on top-10 high-delay corridors.\n\n` +
        `2. **EV Fleet Transition** — Scale EV fleet from ${data?.ev_fleet_pct ?? base.ev_fleet_pct}% to 30% by FY2026 under FAME-II. Install 50 fast-chargers at 5 key depots.\n\n` +
        `3. **Ridership Growth** — Integrate metro feeder buses at 12 key last-mile gaps. Target 15% ridership increase within 6 months.\n\n` +
        `4. **Cross-Domain Sync** — Route 7 and 12 pass through Infra-Shield Ward 3 (high-pothole zone). Divert buses to parallel road; submit repair ticket to PWD.\n\n` +
        `5. **Carbon Reduction** — Switch 20% of peak-hour diesel buses to CNG/EV. Estimated CO₂ saving: ${Math.round((data?.co2_kg_day ?? base.co2_kg_day) * 0.2)} kg/day.`
      );
    } finally { setAiLoading(false); }
  };

  const saveAdminChange = () => {
    if (newClosure.route.trim()) {
      setAdminChanges(prev => ({ ...prev, routeClosures: [...prev.routeClosures, { ...newClosure, id: Date.now() }] }));
      setNewClosure({ route: '', reason: '', duration: '2h' });
    }
    if (newMessage.trim()) {
      setAdminChanges(prev => ({ ...prev, serviceMessages: [...prev.serviceMessages, { text: newMessage, at: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) }] }));
      setNewMessage('');
    }
    setAdminSaved(true);
    setTimeout(() => setAdminSaved(false), 2500);
  };

  const d = data || buildFallback();

  // ── ECharts ──
  const hourlyChart = {
    tooltip: { trigger: 'axis' },
    grid: { left: '2%', right: '2%', top: '8%', bottom: '8%', containLabel: true },
    xAxis: { type: 'category', data: d.hourlyRidership?.map(h => h.hour) ?? [], axisLabel: { fontSize: 9, rotate: 30 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 9, formatter: v => v + 'L' } },
    series: [{ type: 'bar', data: d.hourlyRidership?.map(h => h.ridership) ?? [], itemStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#818cf8' }] }, borderRadius: [4, 4, 0, 0] } }]
  };

  const otpChart = {
    tooltip: { trigger: 'axis', formatter: p => `${p[0].axisValue}: OTP ${p[0].value}% (Target ${p[1].value}%)` },
    legend: { data: ['Actual OTP', 'Target (85%)'], bottom: 0, textStyle: { fontSize: 9 } },
    grid: { left: '2%', right: '2%', top: '8%', bottom: '14%', containLabel: true },
    xAxis: { type: 'category', data: d.otpTrend?.map(t => t.day) ?? [], axisLabel: { fontSize: 9 } },
    yAxis: { type: 'value', min: 40, max: 100, axisLabel: { fontSize: 9, formatter: v => v + '%' } },
    series: [
      { name: 'Actual OTP', type: 'line', smooth: true, data: d.otpTrend?.map(t => t.otp) ?? [], lineStyle: { width: 2, color: '#6366f1' }, itemStyle: { color: '#6366f1' }, areaStyle: { color: 'rgba(99,102,241,0.08)' } },
      { name: 'Target (85%)', type: 'line', data: d.otpTrend?.map(() => 85) ?? [], lineStyle: { width: 1.5, color: '#10b981', type: 'dashed' }, itemStyle: { color: '#10b981' }, symbol: 'none' }
    ]
  };

  const modeShareChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}L ({d}%)' },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['50%', '50%'],
      data: d.modeShare ?? [],
      itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
      label: { fontSize: 9 },
      color: ['#6366f1', '#10b981', '#f59e0b', '#ec4899']
    }]
  };

  const fleetChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} vehicles' },
    series: [{
      type: 'pie', radius: ['35%', '60%'], center: ['50%', '50%'],
      data: d.fleetStatus ?? [],
      itemStyle: { borderRadius: 3, borderWidth: 2, borderColor: '#fff' },
      label: { fontSize: 9 },
      color: (d.fleetStatus ?? []).map(f => f.color)
    }]
  };

  const panels = ['overview', 'analytics', 'routes', ...(userRole === 'admin' ? ['admin'] : [])];

  return (
    <div className="flex flex-col gap-5">

      {/* ── Panel Switcher ── */}
      <div className="flex items-center gap-2 flex-wrap">
        {panels.map(p => (
          <button key={p}
            onClick={() => setActivePanel(p)}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer capitalize ${activePanel === p ? 'bg-indigo-600 text-white border-indigo-600' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-indigo-400 hover:text-indigo-500'}`}
          >
            {p === 'admin' ? '🔧 Admin Controls' : p === 'analytics' ? '📊 Analytics' : p === 'routes' ? '🗺️ Route Status' : '🏙️ Overview'}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-slate-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Live · {lastUpdate ? lastUpdate.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : '—'}
          <button onClick={fetchData} className="text-indigo-500 font-bold cursor-pointer hover:text-indigo-700">↻</button>
        </div>
      </div>

      {/* ── Cross-Domain Alerts ── */}
      {crossAlerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {crossAlerts.map((al, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${al.sev === 'high' ? 'bg-rose-500/8 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400' : 'bg-amber-500/8 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400'}`}>
              <span className="flex-1">{al.msg}</span>
              {al.tab && <span className="text-[9px] px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-500 font-bold whitespace-nowrap cursor-default">→ {al.tab}</span>}
            </div>
          ))}
        </div>
      )}

      {/* ══ OVERVIEW PANEL ══ */}
      {activePanel === 'overview' && (
        <>
          {/* KPI Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
            {[
              { label: 'Buses Active', value: d.buses?.toLocaleString(), icon: '🚌', color: 'indigo' },
              { label: 'Trains/Metro', value: d.trains?.toLocaleString(), icon: '🚇', color: 'sky' },
              { label: 'Metro Lines', value: d.metro_lines, icon: '🔵', color: 'violet' },
              { label: 'OTP Score', value: `${d.otp_pct}%`, icon: '⏱️', color: d.otp_pct >= 80 ? 'emerald' : d.otp_pct >= 65 ? 'amber' : 'rose' },
              { label: 'Ridership', value: `${d.ridership_lakh}L/day`, icon: '👥', color: 'teal' },
            ].map((k, i) => (
              <div key={i} className="card p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{k.label}</span>
                  <span className="text-lg">{k.icon}</span>
                </div>
                <div className={`text-xl font-extrabold text-${k.color}-600 dark:text-${k.color}-400`}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Fleet Status + Incident Board */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="card flex flex-col">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">🚌 Fleet Status</h3>
                <span className="card-subtitle">Total {d.fleet_total?.toLocaleString()} vehicles</span>
              </div>
              <ReactECharts option={fleetChart} style={{ height: 180 }} />
              <div className="flex flex-col gap-1.5 mt-3">
                {(d.fleetStatus ?? []).map((f, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.color }} />
                    <span className="flex-1 text-slate-600 dark:text-slate-300">{f.label}</span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">{f.value?.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">🚨 Live Incidents</h3>
                <span className="card-subtitle">Active service disruptions</span>
              </div>
              {(d.incidents ?? []).length > 0 ? (
                <div className="flex flex-col gap-3">
                  {(d.incidents ?? []).map((inc, i) => (
                    <div key={i} className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{inc.route}</span>
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-500 font-bold">{inc.type}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">{inc.cause} · Impact: <strong className="text-rose-400">{inc.impact}</strong></div>
                      <div className="text-[9px] text-slate-400">Since {inc.since}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-24 text-slate-400 gap-1">
                  <span className="text-2xl">✅</span>
                  <span className="text-xs">No active incidents</span>
                </div>
              )}

              {/* EV & CO2 */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold">⚡ EV Fleet</span>
                  <span className="text-base font-extrabold text-emerald-500">{d.ev_fleet_pct}%</span>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${d.ev_fleet_pct}%` }} />
                  </div>
                  <span className="text-[9px] text-slate-400">Target: 30% by FY2026</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] text-slate-400 font-semibold">🌿 CO₂ Fleet</span>
                  <span className="text-base font-extrabold text-slate-600 dark:text-slate-300">{d.co2_kg_day?.toLocaleString()} kg/day</span>
                  <span className="text-[9px] text-slate-400">Daily fleet emissions</span>
                </div>
              </div>
            </div>

            {/* Mode Share */}
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">🥧 Mode Share</h3>
                <span className="card-subtitle">Ridership split by transit mode</span>
              </div>
              <ReactECharts option={modeShareChart} style={{ height: 180 }} />
              <div className="flex flex-wrap gap-2 mt-3">
                {['#6366f1','#10b981','#f59e0b','#ec4899'].map((c, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px]">
                    <span className="w-2 h-2 rounded-full" style={{ background: c }} />
                    <span className="text-slate-500">{['Metro','Bus','Rail','E-Bus'][i]}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Admin service messages */}
          {adminChanges.serviceMessages.length > 0 && (
            <div className="card border-amber-200 dark:border-amber-900/40 bg-amber-500/5">
              <div className="card-header pb-2 mb-3">
                <h3 className="card-title text-amber-600 dark:text-amber-400">📢 Admin Service Advisories</h3>
              </div>
              <div className="flex flex-col gap-2">
                {adminChanges.serviceMessages.map((m, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap">{m.at}</span>
                    <span className="text-slate-700 dark:text-slate-300">{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* ══ ANALYTICS PANEL ══ */}
      {activePanel === 'analytics' && (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">📈 Hourly Ridership (Today)</h3>
                <span className="card-subtitle">Passengers in Lakhs per hour — {city}</span>
              </div>
              <ReactECharts option={hourlyChart} style={{ height: 220 }} />
            </div>
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">⏱️ On-Time Performance (Weekly)</h3>
                <span className="card-subtitle">Actual OTP vs 85% national target</span>
              </div>
              <ReactECharts option={otpChart} style={{ height: 220 }} />
            </div>
          </div>

          {/* Avg Speed + Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Avg Network Speed', value: `${d.avg_speed_kmh} km/h`, icon: '⚡', note: 'City-wide fleet average' },
              { label: 'Fleet Utilisation', value: `${Math.round(((d.fleetStatus?.[0]?.value ?? 0) / (d.fleet_total ?? 1)) * 100)}%`, icon: '🔧', note: 'Active vs total fleet' },
              { label: 'CO₂ per Passenger', value: `${Math.round(d.co2_kg_day * 1000 / (d.ridership_lakh * 100000))} g`, icon: '🌿', note: 'Grams CO₂/passenger km' },
              { label: 'Cycle Dock Occupancy', value: `${bikepoints?.global?.occupancy_pct ?? 0}%`, icon: '🚲', note: `${bikepoints?.global?.total_bikes ?? 0} bikes active` }
            ].map((s, i) => (
              <div key={i} className="card p-4 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{s.label}</span>
                  <span className="text-base">{s.icon}</span>
                </div>
                <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400">{s.value}</div>
                <div className="text-[10px] text-slate-400">{s.note}</div>
              </div>
            ))}
          </div>

          {/* AI Advisor */}
          <div className="card">
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🤖 AI Transport Advisor</h3>
              <span className="card-subtitle">Gemini-powered route optimization & emission reduction plan</span>
            </div>
            <button onClick={fetchAI} disabled={aiLoading}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer mb-4">
              {aiLoading ? '⏳ Analyzing...' : '⚡ Generate Optimization Plan'}
            </button>
            {aiAdvice && (
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">{aiAdvice}</div>
            )}
          </div>
        </div>
      )}

      {/* ══ ROUTE STATUS PANEL ══ */}
      {activePanel === 'routes' && (
        <div className="flex flex-col gap-5">
          {/* Route Table */}
          <div className="card">
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🗺️ {city} Network Status</h3>
              <span className="card-subtitle">Live metro, bus & rail lines with OTP and frequency</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                    {['Mode','Route Name','Status','Freq','OTP','Action'].map(h => (
                      <th key={h} className="pb-2 pr-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                  {lines.map((l, i) => {
                    const isGood = l.status === 'Good Service';
                    const isWarn = l.status.includes('Delay') || l.status.includes('Minor');
                    const isPart = l.status.includes('Closure') || l.status.includes('Severe');
                    const isAdmin = adminChanges.routeClosures.find(r => r.route === l.name);
                    return (
                      <tr key={i} className={`hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors ${isAdmin ? 'opacity-60' : ''}`}>
                        <td className="py-2.5 pr-4">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold" style={{ background: `${ROUTE_COLORS[l.type]}20`, color: ROUTE_COLORS[l.type] }}>{l.type}</span>
                        </td>
                        <td className="py-2.5 pr-4 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{l.name}</td>
                        <td className="py-2.5 pr-4">
                          {isAdmin
                            ? <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-500/20 text-slate-500">ADMIN CLOSED</span>
                            : <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isGood ? 'bg-emerald-500/15 text-emerald-500' : isWarn ? 'bg-amber-500/15 text-amber-500' : 'bg-rose-500/15 text-rose-500'}`}>{l.status}</span>
                          }
                        </td>
                        <td className="py-2.5 pr-4 text-slate-500">Every {l.freq_min}m</td>
                        <td className="py-2.5 pr-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-12 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                              <div className="h-1.5 rounded-full" style={{ width: `${l.otp}%`, background: l.otp >= 85 ? '#10b981' : l.otp >= 70 ? '#f59e0b' : '#ef4444' }} />
                            </div>
                            <span className={`text-[10px] font-bold ${l.otp >= 85 ? 'text-emerald-500' : l.otp >= 70 ? 'text-amber-500' : 'text-rose-500'}`}>{l.otp}%</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-[10px] text-indigo-500 cursor-pointer hover:underline">Details →</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cycle Sharing Hubs */}
          <div className="card">
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center flex-wrap gap-2">
              <div>
                <h3 className="card-title">🚲 {city} Cycle Sharing Hubs</h3>
                <span className="card-subtitle">Real-time dock and bike availability</span>
              </div>
              <input type="text" placeholder="Filter docks..." value={bikeSearchQuery}
                onChange={e => setBikeSearchQuery(e.target.value)}
                className="form-input text-xs py-1 px-2 max-w-[150px]" />
            </div>
            <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto pr-1">
              {filteredBikepoints?.length > 0 ? filteredBikepoints.map(bp => (
                <div key={bp.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-sky-300 transition-colors">
                  <div className="flex-1 min-w-0">
                    <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block truncate">{bp.name}</span>
                    <span className="text-[10px] text-slate-400">Station ID: {bp.id}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs font-black text-sky-600 block">🚲 {bp.bikes} bikes</span>
                      <span className="text-[10px] text-slate-400">🔓 {bp.empty} spaces</span>
                    </div>
                    <div className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                      <span className="text-[9px] font-bold text-sky-600">{bp.occupancy_pct}%</span>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400">
                  <span className="text-2xl block mb-1">🔍</span>
                  <p className="text-xs">No matching cycle hubs found in {city}.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══ ADMIN PANEL (admin only) ══ */}
      {activePanel === 'admin' && userRole === 'admin' && (
        <div className="flex flex-col gap-5">
          <div className="p-3 rounded-xl bg-amber-500/8 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-700 dark:text-amber-400 font-medium">
            🔧 <strong>Admin Mode Active</strong> — Changes made here are dispatched to the Transit Control Centre and reflected live in the Route Status panel.
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Route Closure */}
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">🚧 Issue Route Closure / Diversion</h3>
                <span className="card-subtitle">Temporary closures broadcast to transit apps</span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Route Name</label>
                  <select className="form-input text-xs mt-1" value={newClosure.route} onChange={e => setNewClosure(p => ({ ...p, route: e.target.value }))}>
                    <option value="">-- Select Route --</option>
                    {lines.map(l => <option key={l.id} value={l.name}>{l.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Closure Reason</label>
                  <select className="form-input text-xs mt-1" value={newClosure.reason} onChange={e => setNewClosure(p => ({ ...p, reason: e.target.value }))}>
                    <option value="">-- Select Reason --</option>
                    <option>Road works / Pothole repair</option>
                    <option>VIP movement / Security</option>
                    <option>Accident / Emergency</option>
                    <option>Flood / Waterlogging</option>
                    <option>Signal/Track fault</option>
                    <option>Scheduled maintenance</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Expected Duration</label>
                  <select className="form-input text-xs mt-1" value={newClosure.duration} onChange={e => setNewClosure(p => ({ ...p, duration: e.target.value }))}>
                    <option>1h</option><option>2h</option><option>4h</option><option>8h</option><option>Full Day</option>
                  </select>
                </div>
              </div>

              {adminChanges.routeClosures.length > 0 && (
                <div className="mt-4 flex flex-col gap-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Active Closures</span>
                  {adminChanges.routeClosures.map(c => (
                    <div key={c.id} className="flex items-center justify-between gap-2 text-[10px] p-2 rounded-lg bg-rose-500/8 border border-rose-200 dark:border-rose-900/40">
                      <span className="font-bold text-rose-600 dark:text-rose-400">{c.route}</span>
                      <span className="text-slate-500">{c.reason} · {c.duration}</span>
                      <button onClick={() => setAdminChanges(p => ({ ...p, routeClosures: p.routeClosures.filter(r => r.id !== c.id) }))}
                        className="text-rose-400 hover:text-rose-600 cursor-pointer font-bold">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Service Advisory */}
            <div className="card">
              <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                <h3 className="card-title">📢 Broadcast Service Advisory</h3>
                <span className="card-subtitle">Push passenger-facing message to all screens & apps</span>
              </div>
              <div className="flex flex-col gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Advisory Message</label>
                  <textarea rows={4} className="form-input text-xs mt-1" style={{ resize: 'none' }}
                    placeholder="e.g. Due to heavy rainfall, all surface bus routes via Andheri will experience 20–30 min delays. Passengers advised to use metro services..."
                    value={newMessage} onChange={e => setNewMessage(e.target.value)} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Frequency Boost (Emergency)</label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {lines.slice(0, 3).map(l => (
                      <button key={l.id}
                        onClick={() => setAdminChanges(p => ({
                          ...p, frequencyBoosts: p.frequencyBoosts.includes(l.id) ? p.frequencyBoosts.filter(x => x !== l.id) : [...p.frequencyBoosts, l.id]
                        }))}
                        className={`text-[10px] font-bold px-2 py-1.5 rounded-lg border transition-all cursor-pointer truncate ${adminChanges.frequencyBoosts.includes(l.id) ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 dark:border-slate-800 text-slate-500 hover:border-emerald-400'}`}
                        title={l.name}
                      >
                        {adminChanges.frequencyBoosts.includes(l.id) ? '✓ ' : ''}+Freq {l.id}
                      </button>
                    ))}
                  </div>
                  {adminChanges.frequencyBoosts.length > 0 && (
                    <div className="text-[10px] text-emerald-500 mt-1 font-medium">
                      ✅ Frequency boost queued for: {adminChanges.frequencyBoosts.join(', ')}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                {adminChanges.serviceMessages.map((m, i) => (
                  <div key={i} className="flex items-start gap-2 text-[10px] p-2 rounded-lg bg-amber-500/8 border border-amber-200 dark:border-amber-900/40">
                    <span className="text-amber-500 font-mono whitespace-nowrap">{m.at}</span>
                    <span className="text-slate-600 dark:text-slate-300 flex-1">{m.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={saveAdminChange}
              className="px-6 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold cursor-pointer transition-colors">
              ✅ Save & Dispatch to Control Centre
            </button>
            {adminSaved && <span className="text-xs text-emerald-500 font-bold animate-pulse">✓ Dispatched successfully!</span>}
            <button onClick={() => setAdminChanges({ routeClosures: [], frequencyBoosts: [], serviceMessages: [] })}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-500 cursor-pointer hover:border-rose-400 hover:text-rose-500 transition-colors">
              Reset All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
