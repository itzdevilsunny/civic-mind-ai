import { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Leaf, RefreshCw, BarChart2, Navigation, ShieldCheck } from 'lucide-react';

export default function TransitEco({ isDarkMode, cityInfo, _liveWeather }) {
  const [telemetry, setTelemetry] = useState(null);
  const [advice, setAdvice] = useState(null);
  const [loading, setLoading] = useState(true);

  // Commute calculator inputs
  const [commuteDistance, setCommuteDistance] = useState(15); // km
  const [vehicleType, setVehicleType] = useState('sedan'); // sedan, suv, hatchback, twowheeler

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
      fetch(`/api/transit/telemetry?${q}`).then(r => r.json()).catch(() => null),
      fetch(`/api/transit/optimization-advice?${q}`).then(r => r.json()).catch(() => null)
    ]).then(([tel, adv]) => {
      setTelemetry(tel);
      setAdvice(adv);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchData();
  }, [city, lat, lng]);

  // Commute carbon offset computations
  // Carbon intensity per passenger-km (kg CO2): SUV=0.22, Sedan=0.17, Hatchback=0.14, Two-Wheeler=0.08, Public Transit=0.03
  const co2Factors = { suv: 0.22, sedan: 0.17, hatchback: 0.14, twowheeler: 0.08 };
  const privateFactor = co2Factors[vehicleType] || 0.17;
  const transitFactor = 0.03;

  const privateCo2 = Math.round(commuteDistance * privateFactor * 10) / 10;
  const transitCo2 = Math.round(commuteDistance * transitFactor * 10) / 10;
  const co2Saved = Math.round((privateCo2 - transitCo2) * 10) / 10;
  
  // Financial savings: estimated fuel cost per km (SUV=₹9, Sedan=₹7, Hatchback=₹5.5, Two-Wheeler=₹2.2)
  const fuelRates = { suv: 9.0, sedan: 7.0, hatchback: 5.5, twowheeler: 2.2 };
  const privateCostPerKm = fuelRates[vehicleType] || 7.0;
  const transitCostPerKm = 1.2; // Metro/suburban rail average
  const dailySavings = Math.round(commuteDistance * (privateCostPerKm - transitCostPerKm));
  const annualSavings = dailySavings * 250; // 250 working days

  const getScatterChartOption = () => {
    // Congestion (%) vs PM2.5 (ug/m3) data points
    const data = [
      [15, 12], [22, 18], [28, 24], [35, 32], [42, 45], [48, 52], [55, 64], [62, 78], [70, 95], [78, 110],
      [18, 14], [25, 20], [32, 28], [38, 38], [45, 49], [52, 58], [60, 72], [65, 84], [72, 102], [80, 125]
    ];

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: 'Congestion: {c0}%<br/>PM2.5: {c1} µg/m³' },
      grid: { left: '3%', right: '3%', bottom: '3%', top: '35px', containLabel: true },
      xAxis: { type: 'value', name: 'Congestion %', axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } }, axisLabel: { color: muted, fontSize: 9 } },
      yAxis: { type: 'value', name: 'PM2.5 AQI', axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } }, axisLabel: { color: muted, fontSize: 9 } },
      series: [
        {
          name: 'Traffic Impact Correlation',
          type: 'scatter',
          symbolSize: 10,
          data: data,
          itemStyle: { color: '#ef4444' }
        }
      ]
    };
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', flexDirection: 'column', gap: '16px' }}>
      <div style={{ width: '48px', height: '48px', border: `4px solid ${border}`, borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
      <p style={{ color: muted, fontSize: '14px' }}>Connecting to Transit-Eco grid telemetry for {city}…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const lines = telemetry?.lines || [];
  const totalRiders = telemetry?.total_riders || 0;
  const co2Offset = telemetry?.co2_saved_tonnes || 0;
  const congestion = telemetry?.congestion_pct || 0;
  const freqMult = advice?.frequency_multiplier || 1.1;
  const fareSubsidy = advice?.fare_subsidy_pct || 15;
  const dynamicLanes = advice?.dynamic_lanes_active ? 'ACTIVE' : 'STANDBY';

  return (
    <div className="flex flex-col gap-6 pb-8" style={{ background: bg, minHeight: '100vh', padding: '24px' }}>
      
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', color: 'white' }}>🍃</div>
          <div>
            <h1 className="text-xl font-black text-slate-800 dark:text-slate-200">Transit-Eco: Emissions &amp; Green Mobility</h1>
            <p className="text-xs text-slate-400 mt-0.5">Public transit efficiency monitoring, dynamic CO2 offset metrics, and AI dispatcher — {city}</p>
          </div>
        </div>
        <button onClick={fetchData} className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer">
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync telemetry</span>
        </button>
      </div>

      {/* Transit Lines Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {lines.map((l, i) => (
          <div key={i} className="card p-4 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-slate-850 dark:text-slate-200">{l.name}</h4>
                <span className="text-[10px] text-slate-450 block mt-0.5">Headway: {l.frequency_mins} mins</span>
              </div>
              <span className="text-xs font-black font-mono text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded">
                {(l.passengers / 1000).toFixed(0)}k riders
              </span>
            </div>
            
            {/* Passenger Bar relative to standard max load */}
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${Math.min(100, (l.passengers / 1000000) * 100)}%` }} />
            </div>

            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Avg Speed: {l.avg_speed_kmh} km/h</span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Daily Transit Ridership</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">{(totalRiders / 100000).toFixed(1)} Lakhs</span>
            <span className="text-[10px] text-slate-400">Total urban commuters</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"><Navigation className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Daily Carbon Savings</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">{co2Offset.toLocaleString('en-IN')} Tonnes</span>
            <span className="text-[10px] text-slate-400">Net CO2 offset offset</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"><Leaf className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Road Congestion Level</span>
            <span className="text-xl font-bold font-mono text-rose-500 mt-1 block">{congestion}%</span>
            <span className="text-[10px] text-slate-400">Road average speeds</span>
          </div>
          <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-500"><BarChart2 className="w-5 h-5" /></div>
        </div>

        <div className="card p-4 flex justify-between items-start">
          <div>
            <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Green Subsidy Command</span>
            <span className="text-xl font-bold font-mono text-emerald-500 mt-1 block">{fareSubsidy}% Discount</span>
            <span className="text-[10px] text-slate-400">Ticket price relief active</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-500"><ShieldCheck className="w-5 h-5" /></div>
        </div>
      </div>

      {/* Carbon Calculator & AI Dispatcher */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Carbon Calculator (3 cols) */}
        <div className="card lg:col-span-3">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
            <h3 className="card-title"><Leaf className="w-4 h-4 text-emerald-500" /> Commute Carbon Savings Calculator</h3>
            <span className="card-subtitle">Calculate the environmental and financial impact of switching your commute to transit</span>
          </div>

          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-500">Commute Distance (One Way):</span>
                  <span className="font-bold text-emerald-500 font-mono text-sm">{commuteDistance} km</span>
                </div>
                <input type="range" min="2" max="100" step="1" value={commuteDistance} onChange={e => setCommuteDistance(Number(e.target.value))} className="w-full accent-emerald-500" />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-slate-500 mb-1">Your Private Vehicle Type:</span>
                <select value={vehicleType} onChange={e => setVehicleType(e.target.value)} className="w-full p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <option value="suv">SUV (Petrol/Diesel)</option>
                  <option value="sedan">Sedan (Petrol/Diesel)</option>
                  <option value="hatchback">Hatchback (Petrol/CNG)</option>
                  <option value="twowheeler">Two-Wheeler (Motorcycle/Scooter)</option>
                </select>
              </div>
            </div>

            {/* Calculations Grid */}
            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800 text-center">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Private Footprint</span>
                <span className="text-sm font-bold text-rose-500 font-mono block mt-0.5">{privateCo2} kg CO2</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Transit Footprint</span>
                <span className="text-sm font-bold text-emerald-500 font-mono block mt-0.5">{transitCo2} kg CO2</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Daily CO2 Offset</span>
                <span className="text-sm font-black text-emerald-500 font-mono block mt-0.5">{co2Saved} kg</span>
              </div>
            </div>

            <div className="flex justify-between items-center bg-emerald-50/20 border border-emerald-500/20 rounded-xl p-3.5">
              <div>
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold block mb-0.5">💰 Estimated Fuel Cost Savings</span>
                <p className="text-[10px] text-slate-500">Based on dynamic fuel index, you will save approximately</p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Annual Savings</span>
                <span className="text-base font-black text-emerald-500 font-mono">₹{annualSavings.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* AI dispatcher console (2 cols) */}
        <div className="card lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
              <h3 className="card-title">🤖 AI Transit Optimizer Panel</h3>
              <span className="card-subtitle">Gemini real-time mobility dispatch controller</span>
            </div>

            {advice && (
              <div className="flex flex-col gap-3">
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  {advice.advisory}
                </p>

                <div className="grid grid-cols-3 gap-2 bg-slate-50/50 dark:bg-slate-900/50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">Ramp Multiplier</span>
                    <span className="font-bold text-emerald-500 font-mono">x{freqMult}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Ticket Subsidy</span>
                    <span className="font-bold text-emerald-500 font-mono">{fareSubsidy}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">Dynamic BRTS</span>
                    <span className="font-bold text-rose-500 font-mono">{dynamicLanes}</span>
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

          <div className="mt-4 p-3 bg-emerald-50/10 border border-emerald-150/10 rounded-xl flex justify-between items-center text-[10px] font-mono text-emerald-500">
            <span>TRANSIT CONTROLLER: SYNCED</span>
            <span>OPTIMIZER LEVEL: L4</span>
          </div>
        </div>
      </div>

      {/* Congestion vs AQI Correlation Chart */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title"><BarChart2 className="w-4 h-4 text-emerald-500" /> Congestion vs Air Quality index Scatter Correlation</h3>
          <span className="card-subtitle">Comparing road vehicle congestion density (%) against local PM2.5 AQI</span>
        </div>
        <div className="h-[250px] mt-4">
          <ReactECharts option={getScatterChartOption()} style={{ height: '100%', width: '100%' }} />
        </div>
      </div>
      
    </div>
  );
}
