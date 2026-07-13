import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Activity, RefreshCw } from 'lucide-react';

export default function HealthWatch({ isDarkMode, cityInfo, _liveAqi }) {
  const [telemetry, setTelemetry] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Triage state
  const [hasFever, setHasFever] = useState(false);
  const [hasCough, setHasCough] = useState(false);
  const [hasRashes, setHasRashes] = useState(false);
  const [hasBreathingDifficulty, setHasBreathingDifficulty] = useState(false);
  const [durationDays, setDurationDays] = useState(3);

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
      fetch(`/api/health/telemetry?${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/health/dispatch-advice?${q}`).then(r => r.json()).catch(() => null)
    ]).then(([tel, adv]) => {
      setTelemetry(tel);
      setAdvice(adv);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [city, lat, lng]);

  // Citizen Triage Logic
  let triagePriority = 'Green (Standard)';
  let triageColor = '#10b981';
  let triageAdvice = 'Self-care at home. Rest, hydrate, and monitor temperature.';
  
  if (hasBreathingDifficulty || (hasFever && durationDays >= 6)) {
    triagePriority = 'Red (Critical)';
    triageColor = '#ef4444';
    triageAdvice = 'Immediate medical attention required. Proceed to the nearest hospital emergency room.';
  } else if ((hasFever && hasRashes) || (hasCough && durationDays >= 7) || (hasFever && durationDays >= 3)) {
    triagePriority = 'Yellow (Urgent)';
    triageColor = '#f59e0b';
    triageAdvice = 'Schedule a visit at your nearest community health clinic within 24 hours.';
  }

  const getOutbreakChartOption = () => {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6'];
    const admissions = [140, 155, 185, 230, 310, 280]; // simulated admission count
    const rainfall = [12, 18, 35, 62, 110, 85]; // simulated mm rain

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      legend: { data: ['Weekly Admissions', 'Weekly Rainfall (mm)'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '35px', containLabel: true },
      xAxis: { type: 'category', data: weeks, axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted, fontSize: 9 } },
      yAxis: [
        { type: 'value', name: 'Admissions', axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } }, axisLabel: { color: muted, fontSize: 9 } },
        { type: 'value', name: 'Rainfall', axisLine: { lineStyle: { color: border } }, splitLine: { show: false }, axisLabel: { color: muted, fontSize: 9 } }
      ],
      series: [
        { name: 'Weekly Admissions', type: 'bar', itemStyle: { color: '#6366f1' }, data: admissions },
        { name: 'Weekly Rainfall (mm)', type: 'line', yAxisIndex: 1, smooth: true, itemStyle: { color: '#0ea5e9' }, lineStyle: { width: 2.5 }, data: rainfall }
      ]
    };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: `4px solid ${border}`, borderTopColor: '#ef4444', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: muted, fontSize: '14px' }}>Connecting to Health-Watch sensors for {city}…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const hospitals = telemetry?.hospitals || [];
  const risks = telemetry?.risks || {};
  const triageWait = advice?.triage_wait_time_mins || 30;
  const icuDeficit = advice?.icu_bed_deficit || 0;

  return (
    <div className="flex flex-col gap-6 pb-8" style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#ef4444,#dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white' }}>❤️</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-200">Health-Watch: Disease Surveillance</h1>
            <p className="text-xs text-slate-400 mt-0.5">Hospital capacity trackers, vector disease indexes, and AI triage dispatcher — {city}</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync telemetry</span>
        </button>
      </div>

      {/* Outbreak Risk Warning widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Vector-borne Risk (Dengue/Malaria)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: risks.vector_borne > 60 ? '#ef444422' : '#f59e0b22', color: risks.vector_borne > 60 ? '#ef4444' : '#f59e0b' }}>
              {risks.vector_borne > 60 ? 'HIGH' : 'MODERATE'}
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{risks.vector_borne}/100</span>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-rose-500 transition-all" style={{ width: `${risks.vector_borne}%` }} />
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Respiratory Risk (Dust/Pollution)</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: risks.respiratory > 60 ? '#ef444422' : '#f59e0b22', color: risks.respiratory > 60 ? '#ef4444' : '#f59e0b' }}>
              {risks.respiratory > 60 ? 'CRITICAL' : 'MODERATE'}
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{risks.respiratory}/100</span>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-amber-500 transition-all" style={{ width: `${risks.respiratory}%` }} />
          </div>
        </div>

        <div className="card p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Extreme Heat Stress Risk</span>
            <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: risks.heat_stress > 60 ? '#ef444422' : '#10b98122', color: risks.heat_stress > 60 ? '#ef4444' : '#10b981' }}>
              {risks.heat_stress > 60 ? 'HIGH' : 'LOW'}
            </span>
          </div>
          <span className="text-2xl font-bold font-mono text-slate-800 dark:text-slate-100">{risks.heat_stress}/100</span>
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${risks.heat_stress}%` }} />
          </div>
        </div>
      </div>

      {/* Hospital Capacity Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {hospitals.map((h, idx) => (
          <div key={idx} className="card p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{h.name}</h4>
                <span className="text-[10px] text-slate-400">{h.beds} total capacity beds</span>
              </div>
              <span className="text-sm font-black font-mono text-rose-500">{h.occupancy_pct}%</span>
            </div>
            
            <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${h.occupancy_pct}%` }} />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>ICU Available: {h.icu_avail}</span>
              <span>Est. Wait Time: {h.wait_time_mins} mins</span>
            </div>
          </div>
        ))}
      </div>

      {/* Symptom Checker & AI Advisor */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Symptom Checker (3 cols) */}
        <div className="card lg:col-span-3">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="card-title"><Activity className="w-4 h-4 text-rose-500" /> Interactive Citizen Symptom Triage Guide</h3>
            <span className="card-subtitle">Self-report symptoms to assess priority and find nearest clinical care</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${hasFever ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setHasFever(!hasFever)}>
                <span className="text-sm">🌡️</span>
                <span className="text-xs font-bold">Fever / Temperature</span>
              </div>

              <div className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${hasCough ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setHasCough(!hasCough)}>
                <span className="text-sm">🗣️</span>
                <span className="text-xs font-bold">Dry / Wet Cough</span>
              </div>

              <div className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${hasRashes ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setHasRashes(!hasRashes)}>
                <span className="text-sm">🩹</span>
                <span className="text-xs font-bold">Skin Rashes / Redness</span>
              </div>

              <div className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 transition-all ${hasBreathingDifficulty ? 'bg-rose-500/10 border-rose-500 text-rose-500' : 'border-slate-200 dark:border-slate-800 text-slate-400'}`} onClick={() => setHasBreathingDifficulty(!hasBreathingDifficulty)}>
                <span className="text-sm">🫁</span>
                <span className="text-xs font-bold">Difficulty Breathing</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Duration of Symptoms:</span>
                <span className="font-bold text-rose-500 font-mono text-sm">{durationDays} Day(s)</span>
              </div>
              <input type="range" min="1" max="14" step="1" value={durationDays} onChange={e => setDurationDays(Number(e.target.value))} className="w-full accent-rose-500" />
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Triage Priority Class</span>
                <span className="text-sm font-black font-mono block mt-0.5" style={{ color: triageColor }}>{triagePriority}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Nearest Dispatch Centre</span>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate block mt-0.5">
                  {triagePriority.includes('Red') ? 'Lokmanya Tilak ER Ward' : 'Municipal Clinic Sector 4'}
                </span>
              </div>
            </div>

            {/* Triage advice block */}
            <div className="p-3.5 bg-rose-50/15 border border-rose-500/15 rounded-xl">
              <span className="text-xs text-rose-600 dark:text-rose-400 font-bold block mb-1">📋 Dispatcher Advisory Protocol</span>
              <p className="text-xs text-slate-500 leading-relaxed font-semibold">{triageAdvice}</p>
            </div>
          </div>
        </div>

        {/* AI dispatcher console (2 cols) */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🤖 AI Outbreak Dispatch Advisor</h3>
              <span className="card-subtitle">Gemini real-time health logistics and clinic advisor</span>
            </div>

            {advice && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  {advice.advisory}
                </p>

                <div className="grid grid-cols-2 gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Outpatient Wait Time</span>
                    <span className="font-bold text-rose-500 font-mono">{triageWait} Mins</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Critical ICU Deficit</span>
                    <span className="font-bold text-rose-500 font-mono">-{icuDeficit} Beds</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 mt-2">
                  {advice.actions?.map((act, idx) => {
                    const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[act.priority] || '#94a3b8';
                    return (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-850 dark:text-slate-200">{act.title}</span>
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

          <div className="mt-4 p-3 bg-rose-50/10 border border-rose-150/10 rounded-xl flex justify-between items-center text-[10px] font-mono text-rose-500">
            <span>HEALTH CONTROL: SYNCED</span>
            <span>ALERT LEVEL: LEVEL 1</span>
          </div>
        </div>
      </div>

      {/* Outbreak Correlation Chart */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title"><Activity className="w-4 h-4 text-indigo-500" /> Outbreak Admission &amp; Environmental Correlation</h3>
          <span className="card-subtitle">Correlating weekly hospital admissions with monsoon precipitation trends</span>
        </div>
        <div className="h-[250px] mt-4">
          <ReactECharts option={getOutbreakChartOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
      
    </div>
  );
}
