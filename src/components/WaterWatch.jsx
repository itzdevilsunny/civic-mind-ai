import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Droplet, Info, AlertTriangle, CheckCircle, RefreshCw, BarChart2, Shield } from 'lucide-react';

export default function WaterWatch({ isDarkMode, cityInfo, _liveWeather }) {
  const [telemetry, setTelemetry] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Calculator inputs
  const [members, setMembers] = useState(4);
  const [showerMinutes, setShowerMinutes] = useState(6);
  const [tapMinutes, setTapMinutes] = useState(15);
  const [hasCarWash, setHasCarWash] = useState(false);

  const city = cityInfo?.label || 'Mumbai';
  const lat = cityInfo?.lat || 19.076;
  const lng = cityInfo?.lng || 72.8777;

  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';

  const fetchData = () => {
    setLoading(true);
    const q = `city=${encodeURIComponent(city)}&lat=${lat}&lng=${lng}`;
    Promise.all([
      fetch(`/api/water/telemetry?${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/water/rationing-advice?${q}`).then(r => r.json()).catch(() => null)
    ]).then(([tel, adv]) => {
      setTelemetry(tel);
      setAdvice(adv);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [city, lat, lng]);

  // Citizen water footprint calculation
  // Shower = ~9L/min, Tap = ~6L/min, Car wash = ~120L if true
  const showerUse = members * showerMinutes * 9;
  const tapUse = members * tapMinutes * 6;
  const carUse = hasCarWash ? 120 : 0;
  const totalDailyLitres = Math.round(showerUse + tapUse + carUse);
  const lpcd = Math.round(totalDailyLitres / members);

  // Thresholds: Excellent < 100 LPCD, Moderate 100-135 LPCD, High > 135 LPCD
  let grade = 'Moderate';
  let gradeColor = '#f59e0b';
  if (lpcd < 100) {
    grade = 'Efficient';
    gradeColor = '#10b981';
  } else if (lpcd > 135) {
    grade = 'High Usage';
    gradeColor = '#ef4444';
  }

  const getDistrictChartOption = () => {
    const districts = ['Ward A (South)', 'Ward B (Central)', 'Ward C (West)', 'Ward D (East)', 'Ward E (North)'];
    // Water Supplied vs Consumed vs Estimated Leakage
    const supplied = [120, 145, 110, 160, 95];
    const consumed = [98, 118, 92, 126, 78];
    const leakage = supplied.map((s, idx) => s - consumed[idx]);

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['Billed Consumption', 'Leakage Loss'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '35px', containLabel: true },
      xAxis: { type: 'value', name: 'MLD', axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted, fontSize: 9 } },
      yAxis: { type: 'category', data: districts, axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted, fontSize: 9 } },
      series: [
        { name: 'Billed Consumption', type: 'bar', stack: 'total', itemStyle: { color: '#0ea5e9' }, data: consumed },
        { name: 'Leakage Loss', type: 'bar', stack: 'total', itemStyle: { color: '#ef4444' }, data: leakage }
      ]
    };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: `4px solid ${border}`, borderTopColor: '#0ea5e9', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: muted, fontSize: '14px' }}>Connecting to Water-Watch sensors for {city}…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const lakes = telemetry?.lakes || [];
  const rationingLimit = advice?.rationing_limit_lpcd || 135;
  const pressureReduction = advice?.pressure_reduction_pct || 15;
  const priceCap = advice?.tanker_price_cap_inr || 1200;

  return (
    <div className="flex flex-col gap-6 pb-8" style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#0284c7,#0369a1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white' }}>💧</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-200 font-sans">Water-Watch: Reservoir Analytics</h1>
            <p className="text-xs text-slate-400 mt-0.5">Municipal water reserves monitoring, leakage analytics, and rationing advisor — {city}</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync telemetry</span>
        </button>
      </div>

      {/* Reservoir Capacity Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lakes.map((l, i) => (
          <div key={i} className="card p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">{l.name}</h4>
                <span className="text-[10px] text-slate-400">Total Capacity: {l.capacity_mld.toLocaleString()} MLD</span>
              </div>
              <span className="text-sm font-black font-mono text-sky-500">{l.level_pct}%</span>
            </div>
            
            {/* Level Bar */}
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-sky-500 transition-all duration-500" style={{ width: `${l.level_pct}%` }} />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Inflow: +{l.inflow_mld} MLD</span>
              <span>Outflow: -{l.outflow_mld} MLD</span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Average Reservoir Level</span>
            <span className="text-xl font-bold font-mono text-sky-500 mt-1 block">{telemetry?.avg_level_pct}%</span>
            <span className="text-[10px] text-slate-400">Dynamic storage index</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-500"><Droplet className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Daily Demand Deficit</span>
            <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">-{telemetry?.deficit_mld} MLD</span>
            <span className="text-[10px] text-slate-400">Demand: {telemetry?.total_demand_mld} MLD</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500"><AlertTriangle className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Non-Revenue Leakage Loss</span>
            <span className="text-xl font-bold font-mono text-amber-500 mt-1 block">{telemetry?.leakage_pct}%</span>
            <span className="text-[10px] text-slate-400">Mainline transport loss</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500"><Info className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Rationing Command Cap</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">{rationingLimit} LPCD</span>
            <span className="text-[10px] text-slate-400">Recommended allowance</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"><Shield className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Water Footprint Calculator & AI Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Footprint Calculator (3 cols) */}
        <div className="card lg:col-span-3">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="card-title"><CheckCircle className="w-4 h-4 text-emerald-500" /> Citizen Water Footprint & Leakage Audit</h3>
            <span className="card-subtitle">Calculate your household consumption against municipal safety targets</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Household Members:</span>
                  <span className="font-bold text-sky-500 font-mono text-sm">{members} Person(s)</span>
                </div>
                <input type="range" min="1" max="10" step="1" value={members} onChange={e => setMembers(Number(e.target.value))} className="w-full accent-sky-500" />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Shower Duration (per person):</span>
                  <span className="font-bold text-sky-500 font-mono text-sm">{showerMinutes} Mins</span>
                </div>
                <input type="range" min="1" max="20" step="1" value={showerMinutes} onChange={e => setShowerMinutes(Number(e.target.value))} className="w-full accent-sky-500" />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Tap Usage (washing, cooking, cleaning):</span>
                <span className="font-bold text-sky-500 font-mono text-sm">{tapMinutes} Mins/Day</span>
              </div>
              <input type="range" min="5" max="60" step="5" value={tapMinutes} onChange={e => setTapMinutes(Number(e.target.value))} className="w-full accent-sky-500" />
            </div>

            <div className="flex items-center gap-3">
              <input type="checkbox" id="carwash" checked={hasCarWash} onChange={e => setHasCarWash(e.target.checked)} className="accent-sky-500 w-4 h-4" />
              <label htmlFor="carwash" className="text-xs text-slate-650 dark:text-slate-350 cursor-pointer font-semibold">Includes weekly car wash / outdoor cleaning (+120L)</label>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Total Daily Use</span>
                <span className="text-sm font-bold text-slate-850 dark:text-slate-200 font-mono block mt-0.5">{totalDailyLitres} Litres</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Per Capita (LPCD)</span>
                <span className="text-sm font-bold text-slate-850 dark:text-slate-200 font-mono block mt-0.5" style={{ color: gradeColor }}>{lpcd} LPCD</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Rationing Safety Status</span>
                <span className="text-xs font-black font-mono block mt-0.5" style={{ color: lpcd <= rationingLimit ? '#10b981' : '#ef4444' }}>
                  {lpcd <= rationingLimit ? 'Safe' : 'Exceeded'} ({grade})
                </span>
              </div>
            </div>

            {/* Leak Audit Tip */}
            <div className="p-3.5 bg-sky-50/15 border border-sky-500/15 rounded-xl">
              <span className="text-xs text-sky-600 dark:text-sky-400 font-bold block mb-1">🔍 Self-Leakage Audit Checklist</span>
              <ul className="text-[10px] text-slate-500 list-disc list-inside flex flex-col gap-1 mt-1.5">
                <li>Add food coloring to flush tank; if color leaks into bowl, seal needs replacement (saves ~30L/day).</li>
                <li>Verify water meter dial; if dial turns when all taps are closed, you have a hidden line leak.</li>
                <li>Clean faucet aerators once a quarter to maintain high pressure with 40% less flow volume.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI dispatcher console (2 cols) */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🤖 AI Water Security Advisory</h3>
              <span className="card-subtitle">Gemini real-time municipal rationing and pressure guidelines</span>
            </div>

            {advice && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  {advice.advisory}
                </p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Valve Pressure Cut</span>
                    <span className="font-bold text-rose-500 font-mono">-{pressureReduction}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Tanker Price Cap</span>
                    <span className="font-bold text-emerald-500 font-mono">₹{priceCap} / 5KL</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {advice.actions?.map((act, idx) => {
                    const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[act.priority] || '#94a3b8';
                    return (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityColor + '20', color: priorityColor }}>{act.priority}</span>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-relaxed">{act.action}</p>
                        <span className="text-[9px] text-slate-400">Category: {act.category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-sky-50/10 border border-sky-150/10 rounded-xl flex justify-between items-center text-[10px] font-mono text-sky-500">
            <span>WATER COMMISSIONER: SYNCED</span>
            <span>RATIONING LEVEL: LEVEL 2</span>
          </div>
        </div>
      </div>

      {/* Leakage Loss Chart */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title"><BarChart2 className="w-4 h-4 text-sky-500" /> District Water Loss &amp; Non-Revenue Water Breakdown</h3>
          <span className="card-subtitle">Comparing billable metered consumption vs unmetered transport leakage losses by municipal ward</span>
        </div>
        <div className="h-[250px] mt-4">
          <ReactECharts option={getDistrictChartOption()} style={{ height: '100%', width: '105%' }} />
        </div>
      </div>
      
    </div>
  );
}
