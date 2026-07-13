import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Zap, Sun, IndianRupee, BarChart3, BatteryCharging, AlertTriangle, RefreshCw } from 'lucide-react';

export default function UrjaGrid({ isDarkMode, cityInfo, liveAqi }) {
  const [solarData, setSolarData] = useState(null);
  const [gridData, setGridData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Calculator inputs
  const [roofArea, setRoofArea] = useState(500); // sq ft
  const [monthlyBill, setMonthlyBill] = useState(4000); // INR

  const city = cityInfo?.label || 'Mumbai';
  const lat = cityInfo?.lat || 19.076;
  const lng = cityInfo?.lng || 72.8777;

  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';

  const fetchEnergyData = () => {
    setLoading(true);
    const q = `city=${encodeURIComponent(city)}&lat=${lat}&lng=${lng}`;
    Promise.all([
      fetch(`/api/energy/solar-data?${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/energy/grid-optimization?${q}`).then(r => r.json()).catch(() => null),
    ]).then(([solar, grid]) => {
      setSolarData(solar);
      setGridData(grid);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchEnergyData();
  }, [city, lat, lng]);

  // Citizen Calculator Computations (Based on Indian PM-Surya Ghar Scheme)
  const systemSizeKw = Math.min(20, Math.max(1, Math.round((roofArea / 100) * 10) / 10)); // 100 sq ft per kW
  const installCost = systemSizeKw * 60000; // ~60K INR per kW base cost
  
  // PM-Surya Ghar Subsidy: 30K per kW up to 2kW, 18K for 3rd kW, max 78K
  let subsidy = 0;
  if (systemSizeKw >= 3) subsidy = 78000;
  else if (systemSizeKw >= 2) subsidy = 60000 + (systemSizeKw - 2) * 18000;
  else subsidy = systemSizeKw * 30000;

  const netCost = installCost - subsidy;
  const annualGenKwh = Math.round(systemSizeKw * 1400); // 1400 units/kW/year average in India
  const annualSavings = Math.round(annualGenKwh * 7.5); // Average ₹7.5 per unit
  const paybackYears = Math.round((netCost / Math.max(1, annualSavings)) * 10) / 10;

  // ECharts Grid load curve ("Duck Curve" visualization)
  const getDuckCurveOption = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`);
    
    // Base customer demand (normal load curve in megawatts)
    const baseDemand = [18, 16, 15, 14, 15, 18, 22, 25, 28, 30, 32, 33, 34, 33, 31, 29, 31, 35, 39, 41, 38, 32, 26, 21];
    
    // Solar production curve peaking at noon
    const solarFactor = (solarData?.current?.global_horizontal_irradiance || 450) / 600; // scale based on current weather
    const solarGen = hours.map((_, h) => {
      if (h < 6 || h > 18) return 0;
      const x = h - 12; // distance from noon
      const val = Math.max(0, 18 * Math.exp(-(x * x) / 12) * solarFactor);
      return Math.round(val * 10) / 10;
    });

    // Net demand (base demand minus solar generation)
    const netDemand = baseDemand.map((d, i) => Math.round(Math.max(5, d - solarGen[i]) * 10) / 10);

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis', formatter: '{b}<br/>{a0}: {c0} MW<br/>{a1}: {c1} MW<br/>{a2}: {c2} MW' },
      legend: { data: ['Base Demand', 'Net Grid Demand', 'Solar Output'], textStyle: { color: muted, fontSize: 10 }, top: 0 },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '35px', containLabel: true },
      xAxis: { type: 'category', data: hours, axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted, fontSize: 9 } },
      yAxis: { type: 'value', name: 'Megawatts (MW)', axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } }, axisLabel: { color: muted, fontSize: 9 } },
      series: [
        { name: 'Base Demand', type: 'line', smooth: true, data: baseDemand, itemStyle: { color: '#6366f1' }, lineStyle: { width: 2 } },
        { name: 'Net Grid Demand', type: 'line', smooth: true, data: netDemand, itemStyle: { color: '#0ea5e9' }, lineStyle: { width: 2, type: 'dashed' }, areaStyle: { color: 'rgba(14,165,233,0.06)' } },
        { name: 'Solar Output', type: 'line', smooth: true, data: solarGen, itemStyle: { color: '#f59e0b' }, lineStyle: { width: 2.5 } },
      ]
    };
  };

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'48px', height:'48px', border:`4px solid ${border}`, borderTopColor:'#f59e0b', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <p style={{ color:muted, fontSize:'14px' }}>Connecting to Urja-Grid for {city}…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const solarInfo = solarData?.current;
  const optimization = gridData;
  const battStatus = optimization?.battery_dispatch_recommendation || 'STANDBY';
  const battColor = battStatus === 'CHARGE' ? '#10b981' : battStatus === 'DISCHARGE' ? '#ef4444' : '#f59e0b';

  return (
    <div className="flex flex-col gap-6 pb-8" style={{ background:bg, minHeight:'100vh', padding:'24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg,#f59e0b,#ef4444)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', color:'white' }}>☀️</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-200">Urja-Grid: AI Solar Feasibility</h1>
            <p className="text-xs text-slate-400 mt-0.5">Real-time solar irradiance tracking & Smart grid integration — {city}</p>
          </div>
        </div>
        <button onClick={fetchEnergyData} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Grid</span>
        </button>
      </div>

      {/* Grid Status Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Global Solar Irradiance</span>
            <span className="text-xl font-bold font-mono text-slate-800 dark:text-slate-100 mt-1 block">{(solarInfo?.global_horizontal_irradiance || 0).toFixed(0)} W/m²</span>
            <span className="text-[10px] text-slate-400">DNI: {(solarInfo?.direct_normal_irradiance || 0).toFixed(0)} W/m²</span>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-amber-500"><Sun className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Peak Shaving Target</span>
            <span className="text-xl font-bold font-mono text-sky-500 mt-1 block">{(optimization?.peak_shaving_target_mw || 25).toFixed(1)} MW</span>
            <span className="text-[10px] text-slate-400">Demand response offset</span>
          </div>
          <div className="p-2.5 rounded-xl bg-sky-50 dark:bg-sky-950/20 text-sky-500"><Zap className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Dust/Soiling Efficiency Loss</span>
            <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">{(optimization?.soiling_loss_pct || 12)}%</span>
            <span className="text-[10px] text-slate-400">AQI PM2.5: {liveAqi?.current?.pm2_5 || 32} µg/m³</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500"><AlertTriangle className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Battery Dispatch Command</span>
            <span className="text-xl font-bold font-mono mt-1 block" style={{ color:battColor }}>{battStatus}</span>
            <span className="text-[10px] text-slate-400">Municipal solar storage</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 text-slate-500" style={{ color:battColor, backgroundColor: battColor+'18' }}><BatteryCharging className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Main Grid: Duck Curve vs Rooftop Solar Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Citizen Solar Calculator (3 cols) */}
        <div className="card lg:col-span-3">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="card-title"><IndianRupee className="w-4 h-4 text-emerald-500" /> PM-Surya Ghar Solar Feasibility Calculator</h3>
            <span className="card-subtitle">Estimate savings and installation costs for your home under Central Subsidy Schemes</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Available Rooftop Area:</span>
                <span className="font-bold text-indigo-500 font-mono text-sm">{roofArea} Sq. Ft.</span>
              </div>
              <input type="range" min="100" max="2000" step="50" value={roofArea} onChange={e => setRoofArea(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500">Current Monthly Electricity Bill:</span>
                <span className="font-bold text-indigo-500 font-mono text-sm">₹{monthlyBill.toLocaleString('en-IN')}</span>
              </div>
              <input type="range" min="1000" max="25000" step="500" value={monthlyBill} onChange={e => setMonthlyBill(Number(e.target.value))} className="w-full accent-indigo-500" />
            </div>

            {/* Computation Output Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">Recommended System</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">{systemSizeKw} kW</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">Install Cost (Est.)</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">₹{installCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5">
                <span className="text-[10px] text-slate-400 block font-semibold">Govt. Subsidy</span>
                <span className="text-base font-bold text-emerald-500 font-mono block mt-0.5">₹{subsidy.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Net Pay Amount</span>
                <span className="text-base font-black text-indigo-500 font-mono block mt-0.5">₹{netCost.toLocaleString('en-IN')}</span>
              </div>
              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Annual Generation</span>
                <span className="text-base font-bold text-slate-800 dark:text-slate-200 font-mono block mt-0.5">{annualGenKwh} Units</span>
              </div>
              <div className="p-2.5 border-t border-slate-100 dark:border-slate-800/60">
                <span className="text-[10px] text-slate-400 block font-semibold">Payback Period</span>
                <span className="text-base font-black text-amber-500 font-mono block mt-0.5">{paybackYears} Years</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50/20 border border-emerald-500/20 rounded-xl text-center">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mb-1">🌿 Environmental Impact Offset</span>
              <p className="text-[11px] text-slate-500">This solar system offsets approximately <strong className="text-emerald-500 font-mono">{(systemSizeKw * 1.1).toFixed(1)} tonnes</strong> of CO2 per year, equivalent to planting <strong className="text-emerald-500">{Math.round(systemSizeKw * 48)} trees</strong>.</p>
            </div>
          </div>
        </div>

        {/* AI dispatcher console (2 cols) */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🤖 AI Grid Dispatch Advisory</h3>
              <span className="card-subtitle">Gemini real-time microgrid load balancing advisor</span>
            </div>
            
            {optimization && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  {optimization.advisory}
                </p>
                
                <div className="flex flex-col gap-2 mt-2">
                  {optimization.actions?.map((act, idx) => {
                    const priorityColor = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[act.priority] || '#94a3b8';
                    return (
                      <div key={idx} className="p-2.5 rounded-lg border border-slate-100 dark:border-slate-850 bg-slate-50/30 dark:bg-slate-900/30 flex flex-col gap-1">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{act.title}</span>
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: priorityColor + '20', color: priorityColor }}>{act.priority}</span>
                        </div>
                        <p className="text-[10px] text-slate-450 leading-relaxed">{act.action}</p>
                        <span className="text-[9px] text-slate-450">Category: {act.category}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 p-3 bg-indigo-50/10 border border-indigo-150/10 rounded-xl flex justify-between items-center text-[10px] font-mono text-indigo-500">
            <span>GRID CONTROLLER: SYNCED</span>
            <span>OPTIMIZER LEVEL: L4</span>
          </div>
        </div>
      </div>

      {/* Duck Curve Grid Visualization */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title"><BarChart3 className="w-4 h-4 text-indigo-500" /> Daily Microgrid Load &amp; Solar Peak Analysis</h3>
          <span className="card-subtitle">Visualizing net load curves demonstrating solar peak displacement (Duck Curve Analysis)</span>
        </div>
        <div className="h-[250px] mt-4">
          <ReactECharts option={getDuckCurveOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
      
    </div>
  );
}
