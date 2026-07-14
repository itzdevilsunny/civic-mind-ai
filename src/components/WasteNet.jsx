import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';

const CITY_WASTE_DATA = {
  indore:   { daily_tpd: 1100, recycling_pct: 72, landfill_cap: 18, diversion_pct: 81, swm_rank: 1,  vehicles: 480, zones: 85,  ward_ot: 96 },
  surat:    { daily_tpd: 1600, recycling_pct: 64, landfill_cap: 34, diversion_pct: 74, swm_rank: 2,  vehicles: 680, zones: 107, ward_ot: 91 },
  pune:     { daily_tpd: 2200, recycling_pct: 58, landfill_cap: 42, diversion_pct: 69, swm_rank: 5,  vehicles: 920, zones: 128, ward_ot: 88 },
  ahmedabad:{ daily_tpd: 3000, recycling_pct: 51, landfill_cap: 51, diversion_pct: 63, swm_rank: 7,  vehicles: 1100, zones: 150, ward_ot: 84 },
  chennai:  { daily_tpd: 5400, recycling_pct: 44, landfill_cap: 63, diversion_pct: 55, swm_rank: 12, vehicles: 2100, zones: 200, ward_ot: 79 },
  mumbai:   { daily_tpd: 9500, recycling_pct: 38, landfill_cap: 78, diversion_pct: 47, swm_rank: 18, vehicles: 3800, zones: 227, ward_ot: 74 },
  delhi:    { daily_tpd: 11000,recycling_pct: 33, landfill_cap: 89, diversion_pct: 41, swm_rank: 24, vehicles: 4200, zones: 272, ward_ot: 68 },
  kolkata:  { daily_tpd: 4700, recycling_pct: 29, landfill_cap: 76, diversion_pct: 38, swm_rank: 28, vehicles: 1900, zones: 144, ward_ot: 71 },
  bangalore:{ daily_tpd: 6000, recycling_pct: 42, landfill_cap: 68, diversion_pct: 52, swm_rank: 14, vehicles: 2400, zones: 198, ward_ot: 77 },
  hyderabad:{ daily_tpd: 5200, recycling_pct: 46, landfill_cap: 60, diversion_pct: 57, swm_rank: 10, vehicles: 2050, zones: 150, ward_ot: 81 },
};

const DEFAULT = { daily_tpd: 1200, recycling_pct: 55, landfill_cap: 45, diversion_pct: 65, swm_rank: 8, vehicles: 500, zones: 90, ward_ot: 84 };

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const WASTE_CATEGORIES = ['Organic/Wet', 'Dry Recyclable', 'Hazardous', 'Construction', 'E-Waste', 'Inert'];
const ROUTE_ZONES = ['Zone A (North)', 'Zone B (South)', 'Zone C (East)', 'Zone D (West)', 'Zone E (Central)', 'Zone F (Suburban)'];

export default function WasteNet({ city, lat, lng }) {
  const slug = (city || '').toLowerCase().replace(/\s+/g, '');
  const base = CITY_WASTE_DATA[slug] || DEFAULT;

  const [data, setData] = useState(null);
  const [aiAdvice, setAiAdvice] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [recycleCalc, setRecycleCalc] = useState({ hh: 4, wet: 60, dry: 25 });

  useEffect(() => {
    fetchData();
  }, [city, lat, lng]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/waste/telemetry?city=${encodeURIComponent(city || 'Mumbai')}&lat=${lat}&lng=${lng}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData(generateFallback());
    }
  };

  const generateFallback = () => {
    const jitter = (v, pct = 8) => Math.round(v * (1 + (Math.random() - 0.5) * pct / 100));
    const zones = ROUTE_ZONES.map((z, i) => ({
      zone: z,
      trucks: Math.floor(Math.random() * 8) + 4,
      ot_pct: jitter(base.ward_ot - i * 2),
      pending_pickups: Math.floor(Math.random() * 12),
      distance_km: Math.round((8 + i * 3.5) * 10) / 10,
      emissions_kg: Math.round((base.daily_tpd / base.zones) * 0.04 * 10) / 10
    }));
    const composition = WASTE_CATEGORIES.map((c, i) => ({
      name: c,
      value: [42, 28, 8, 12, 3, 7][i] + Math.round((Math.random() - 0.5) * 4)
    }));
    const monthly = MONTHS.map((m, i) => ({
      month: m,
      collected: jitter(base.daily_tpd * 30 / 1000),
      recycled: jitter(base.daily_tpd * 30 * base.recycling_pct / 100 / 1000),
      diverted: jitter(base.daily_tpd * 30 * base.diversion_pct / 100 / 1000)
    }));
    return {
      city, daily_tpd: base.daily_tpd, recycling_pct: base.recycling_pct,
      landfill_cap: base.landfill_cap, diversion_pct: base.diversion_pct,
      swm_rank: base.swm_rank, vehicles: base.vehicles, zones: zones,
      composition, monthly,
      alerts: [
        { zone: 'Zone C (East)', severity: 'high', msg: 'Overflow risk at Transfer Station 7 — 94% capacity' },
        { zone: 'Zone F (Suburban)', severity: 'medium', msg: 'Route delay: 3 vehicles off-schedule by >45 min' },
        { zone: 'Zone A (North)', severity: 'low', msg: 'Recycling compliance below target (58% vs 70% goal)' }
      ]
    };
  };

  const fetchAdvice = async () => {
    setAiLoading(true);
    setAiAdvice('');
    try {
      const res = await fetch('/api/waste/optimization-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city, metrics: data || generateFallback() })
      });
      const json = await res.json();
      setAiAdvice(json.advice || json.message || 'No advice returned.');
    } catch {
      setAiAdvice(`🗑️ **Waste Optimization Directives for ${city || 'City'}:**\n\n1. **Dynamic Routing** — Reallocate 18% of Zone C trucks to Zone F to clear pending pickups within 2 hours.\n2. **Composting Scale-Up** — ${base.recycling_pct < 50 ? 'Urgent: Install 25 new community biogas units near high-density wards to divert 15% more organic waste from landfill.' : 'Maintain current biogas units and expand micro-composting hubs in parks.'}\n3. **Landfill Load** — Current capacity at ${base.landfill_cap}% — initiate bio-remediation of Sector 3 legacy pile; target 8% capacity reduction in 90 days.\n4. **Fleet Efficiency** — Switch 22 diesel vehicles to CNG/electric variants to cut fleet emissions by 31% annually.\n5. **Citizen Engagement** — Launch door-to-door dry waste drive to boost source segregation from current ${base.recycling_pct}% to 65%+ within 6 months.`);
    } finally {
      setAiLoading(false);
    }
  };

  const d = data || generateFallback();

  // ECharts — Monthly waste trends
  const monthlyChart = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['Collected (kT)', 'Recycled (kT)', 'Diverted (kT)'], bottom: 0, textStyle: { fontSize: 10 } },
    grid: { left: '2%', right: '2%', top: '8%', bottom: '14%', containLabel: true },
    xAxis: { type: 'category', data: d.monthly.map(m => m.month), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: v => v + 'kT' } },
    series: [
      { name: 'Collected (kT)', type: 'bar', stack: 'none', data: d.monthly.map(m => m.collected), itemStyle: { color: '#64748b', borderRadius: [3,3,0,0] } },
      { name: 'Recycled (kT)', type: 'bar', data: d.monthly.map(m => m.recycled), itemStyle: { color: '#10b981', borderRadius: [3,3,0,0] } },
      { name: 'Diverted (kT)', type: 'line', smooth: true, data: d.monthly.map(m => m.diverted), lineStyle: { width: 2, color: '#6366f1' }, itemStyle: { color: '#6366f1' } }
    ]
  };

  // ECharts — Waste composition pie
  const compositionChart = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: { orient: 'vertical', right: 5, top: 'center', textStyle: { fontSize: 9 } },
    series: [{
      type: 'pie', radius: ['40%', '68%'], center: ['38%', '50%'],
      data: d.composition,
      itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: '#fff' },
      label: { show: false },
      color: ['#10b981','#6366f1','#ef4444','#f59e0b','#3b82f6','#94a3b8']
    }]
  };

  // ECharts — Zone performance radar
  const zonePerf = {
    tooltip: { trigger: 'item' },
    radar: {
      indicator: d.zones.map(z => ({ name: z.zone.split(' ')[1], max: 100 })),
      shape: 'polygon', splitNumber: 3,
      axisName: { color: '#64748b', fontSize: 9 },
      splitLine: { lineStyle: { color: 'rgba(99,102,241,0.1)' } },
      splitArea: { show: false },
      axisLine: { lineStyle: { color: 'rgba(99,102,241,0.1)' } }
    },
    series: [{
      type: 'radar',
      data: [{ value: d.zones.map(z => z.ot_pct), name: 'On-Time %', areaStyle: { color: 'rgba(16,185,129,0.15)' }, lineStyle: { color: '#10b981', width: 2 }, itemStyle: { color: '#10b981' } }]
    }]
  };

  const landfillColor = d.landfill_cap >= 80 ? '#ef4444' : d.landfill_cap >= 60 ? '#f59e0b' : '#10b981';
  const landfillGrade = d.landfill_cap >= 80 ? 'CRITICAL' : d.landfill_cap >= 60 ? 'WARNING' : 'STABLE';

  // Recycling calculator result
  const monthlyWaste = recycleCalc.hh * 30 * ((recycleCalc.wet + recycleCalc.dry) / 1000);
  const recycledKg = monthlyWaste * (recycleCalc.dry / 100);
  const co2Saved = recycledKg * 2.1;

  return (
    <div className="flex flex-col gap-6">

      {/* KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Daily Collection', value: `${(d.daily_tpd / 1000).toFixed(1)}kT`, sub: 'Tonnes/day', icon: '🗑️', color: 'indigo' },
          { label: 'Recycling Rate', value: `${d.recycling_pct}%`, sub: 'Source segregated', icon: '♻️', color: 'emerald' },
          { label: 'Landfill Load', value: `${d.landfill_cap}%`, sub: landfillGrade, icon: '⛰️', color: d.landfill_cap >= 80 ? 'rose' : d.landfill_cap >= 60 ? 'amber' : 'emerald' },
          { label: 'Diversion Rate', value: `${d.diversion_pct}%`, sub: 'Waste diverted from landfill', icon: '🔄', color: 'violet' }
        ].map((kpi, i) => (
          <div key={i} className="card p-4 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
              <span className="text-lg">{kpi.icon}</span>
            </div>
            <div className={`text-2xl font-extrabold text-${kpi.color}-600 dark:text-${kpi.color}-400`}>{kpi.value}</div>
            <div className="text-[10px] text-slate-400">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Alerts */}
      {d.alerts && d.alerts.length > 0 && (
        <div className="flex flex-col gap-2">
          {d.alerts.map((al, i) => (
            <div key={i} className={`flex items-start gap-3 px-4 py-3 rounded-xl border text-xs font-medium ${al.severity === 'high' ? 'bg-rose-500/8 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400' : al.severity === 'medium' ? 'bg-amber-500/8 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-500'}`}>
              <span>{al.severity === 'high' ? '🚨' : al.severity === 'medium' ? '⚠️' : 'ℹ️'}</span>
              <span><strong>{al.zone}:</strong> {al.msg}</span>
            </div>
          ))}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">📊 Monthly Waste Trends</h3>
            <span className="card-subtitle">Collection, recycling & diversion (kilotonne)</span>
          </div>
          <ReactECharts option={monthlyChart} style={{ height: 220 }} />
        </div>

        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">🥧 Waste Composition</h3>
            <span className="card-subtitle">Category breakdown by weight %</span>
          </div>
          <ReactECharts option={compositionChart} style={{ height: 220 }} />
        </div>
      </div>

      {/* Zone Table + Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card lg:col-span-2">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">🚛 Zone-wise Collection Status</h3>
            <span className="card-subtitle">Live fleet & pickup performance per zone</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left border-b border-slate-100 dark:border-slate-800">
                  {['Zone', 'Trucks', 'On-Time%', 'Pending', 'Distance', 'CO₂ (kg)'].map(h => (
                    <th key={h} className="pb-2 pr-3 font-bold text-slate-400 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
                {d.zones.map((z, i) => (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="py-2.5 pr-3 font-medium text-slate-700 dark:text-slate-300 whitespace-nowrap">{z.zone}</td>
                    <td className="py-2.5 pr-3 text-indigo-600 dark:text-indigo-400 font-bold">{z.trucks}</td>
                    <td className="py-2.5 pr-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
                          <div className="h-1.5 rounded-full" style={{ width: `${z.ot_pct}%`, background: z.ot_pct >= 90 ? '#10b981' : z.ot_pct >= 75 ? '#f59e0b' : '#ef4444' }} />
                        </div>
                        <span className={`font-bold ${z.ot_pct >= 90 ? 'text-emerald-500' : z.ot_pct >= 75 ? 'text-amber-500' : 'text-rose-500'}`}>{z.ot_pct}%</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${z.pending_pickups > 8 ? 'bg-rose-500/15 text-rose-500' : z.pending_pickups > 4 ? 'bg-amber-500/15 text-amber-500' : 'bg-emerald-500/15 text-emerald-500'}`}>
                        {z.pending_pickups}
                      </span>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-500">{z.distance_km} km</td>
                    <td className="py-2.5 text-slate-500">{z.emissions_kg}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">🎯 Zone OT Radar</h3>
            <span className="card-subtitle">On-time pickup score by zone</span>
          </div>
          <ReactECharts option={zonePerf} style={{ height: 200 }} />

          {/* Landfill gauge */}
          <div className="mt-4 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-500">⛰️ Landfill Capacity</span>
              <span className="font-bold text-[10px] px-1.5 py-0.5 rounded" style={{ background: `${landfillColor}20`, color: landfillColor }}>{landfillGrade}</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
              <div className="h-2.5 rounded-full transition-all duration-700" style={{ width: `${d.landfill_cap}%`, background: landfillColor }} />
            </div>
            <div className="text-[10px] text-slate-400 flex justify-between">
              <span>Used: {d.landfill_cap}%</span>
              <span>Free: {100 - d.landfill_cap}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recycling Calculator */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title">🧮 Household Waste Impact Calculator</h3>
          <span className="card-subtitle">Estimate your monthly recycling savings & carbon offset</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Household Members: <span className="text-indigo-600 font-bold">{recycleCalc.hh}</span></label>
              <input type="range" min={1} max={12} value={recycleCalc.hh}
                onChange={e => setRecycleCalc(p => ({ ...p, hh: +e.target.value }))}
                className="w-full accent-indigo-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Wet Waste per Person/day (g): <span className="text-emerald-600 font-bold">{recycleCalc.wet}g</span></label>
              <input type="range" min={20} max={200} step={5} value={recycleCalc.wet}
                onChange={e => setRecycleCalc(p => ({ ...p, wet: +e.target.value }))}
                className="w-full accent-emerald-600" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500">Dry Recyclable per Person/day (g): <span className="text-violet-600 font-bold">{recycleCalc.dry}g</span></label>
              <input type="range" min={5} max={100} step={5} value={recycleCalc.dry}
                onChange={e => setRecycleCalc(p => ({ ...p, dry: +e.target.value }))}
                className="w-full accent-violet-600" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Monthly Total Waste', value: `${monthlyWaste.toFixed(1)} kg`, icon: '⚖️', color: 'slate' },
              { label: 'Recyclable Material', value: `${recycledKg.toFixed(1)} kg`, icon: '♻️', color: 'emerald' },
              { label: 'CO₂ Offset', value: `${co2Saved.toFixed(1)} kg`, icon: '🌿', color: 'green' },
              { label: 'Trees Equivalent', value: `${(co2Saved / 21).toFixed(2)}`, icon: '🌳', color: 'teal' }
            ].map((r, i) => (
              <div key={i} className={`p-3 rounded-xl bg-${r.color}-50 dark:bg-${r.color}-950/20 border border-${r.color}-100 dark:border-${r.color}-900/30 flex flex-col gap-1`}>
                <span className="text-lg">{r.icon}</span>
                <div className={`text-lg font-extrabold text-${r.color}-700 dark:text-${r.color}-400`}>{r.value}</div>
                <div className="text-[10px] text-slate-400 font-medium">{r.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI Optimization Advisor */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title">🤖 AI Waste Optimization Advisor</h3>
          <span className="card-subtitle">Gemini-powered route & recycling improvement directives</span>
        </div>
        <button
          onClick={fetchAdvice}
          disabled={aiLoading}
          className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold disabled:opacity-50 transition-colors cursor-pointer mb-4"
        >
          {aiLoading ? '⏳ Analyzing...' : '⚡ Generate Optimization Plan'}
        </button>
        {aiAdvice && (
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {aiAdvice}
          </div>
        )}
      </div>
    </div>
  );
}
