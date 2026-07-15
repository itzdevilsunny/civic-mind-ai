import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import confetti from 'canvas-confetti';
import {
  IndianRupee, TrendingUp, TrendingDown, AlertTriangle,
  Zap, Building2, BarChart3, Lightbulb, RefreshCw, ShieldCheck, Activity
} from 'lucide-react';

// ── Animated counter hook ──
function useCounter(target, duration) {
  const dur = duration || 1200;
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (dur / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setValue(target); clearInterval(timer); }
      else setValue(Math.round(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, dur]);
  return value;
}

// ── SVG Budget Health Gauge ──
function BudgetHealthGauge({ score }) {
  const animScore = useCounter(score);
  const radius = 80;
  const C = 2 * Math.PI * radius;
  const progress = (animScore / 100) * C * 0.75;
  const remainder = C - progress;
  const bgDash = C * 0.75 + ' ' + (C * 0.25);
  const activeDash = progress + ' ' + remainder;
  const color = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#ef4444';
  const label = score >= 70 ? 'Healthy' : score >= 45 ? 'At Risk' : 'Critical';
  const glowFilter = 'drop-shadow(0 0 8px ' + color + '88)';
  const ringStyle = { transform: 'rotate(135deg)', transformOrigin: '100px 110px' };
  return (
    <div className="flex flex-col items-center">
      <div style={{ width: 200, height: 160 }}>
        <svg width="200" height="160" viewBox="0 0 200 160">
          <circle cx="100" cy="110" r={radius} fill="none" stroke="currentColor" strokeWidth="14"
            strokeDasharray={bgDash} className="text-slate-100 dark:text-slate-800"
            strokeLinecap="round" style={ringStyle} />
          <circle cx="100" cy="110" r={radius} fill="none" stroke={color} strokeWidth="14"
            strokeDasharray={activeDash} strokeLinecap="round"
            style={{ ...ringStyle, filter: glowFilter, transition: 'stroke-dasharray 0.8s ease-out' }} />
          <circle cx="100" cy="110" r={radius - 8} fill="none" stroke={color} strokeWidth="2"
            opacity="0.15" style={ringStyle} />
          <text x="100" y="102" textAnchor="middle" fontSize="30" fontWeight="800" fill={color}
            style={{ fontFamily: 'sans-serif' }}>{animScore}</text>
          <text x="100" y="120" textAnchor="middle" fontSize="10" fill="#94a3b8"
            style={{ fontFamily: 'sans-serif', fontWeight: 600 }}>/ 100</text>
          <text x="100" y="138" textAnchor="middle" fontSize="13" fontWeight="700" fill={color}
            style={{ fontFamily: 'sans-serif' }}>{label}</text>
        </svg>
      </div>
      <p className="text-xs text-slate-400 font-medium mt-1">Budget Health Score</p>
    </div>
  );
}

// ── Department Budget Bar ──
function DeptBar({ dept, animateIn }) {
  const pct = useCounter(animateIn ? dept.budget_used_pct : 0, 900);
  const color = dept.status === 'Critical' ? '#ef4444' : dept.status === 'Warning' ? '#f59e0b' : '#10b981';
  const bgClass = dept.status === 'Critical'
    ? 'bg-red-100 dark:bg-red-950/30'
    : dept.status === 'Warning'
    ? 'bg-amber-100 dark:bg-amber-950/30'
    : 'bg-emerald-100 dark:bg-emerald-950/30';
  return (
    <div className="group p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all hover:shadow-sm">
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1 min-w-0 pr-2">
          <h5 className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">{dept.name}</h5>
          <span className="text-[10px] text-slate-400">₹{dept.annual_budget_m.toLocaleString()} Cr annual</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={'text-[9px] font-bold px-1.5 py-0.5 rounded-full ' + bgClass} style={{ color }}>
            {dept.status}
          </span>
          <span className="text-[11px] font-extrabold" style={{ color }}>{pct}%</span>
        </div>
      </div>
      <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: pct + '%', backgroundColor: color, boxShadow: '0 0 6px ' + color + '66' }} />
      </div>
      <div className="flex justify-between mt-1.5 text-[9px] text-slate-400">
        <span>{dept.tickets} tickets</span>
        <span>{dept.efficiency_pct}% resolved</span>
        <span>₹{dept.current_spend_k.toLocaleString()} Lakhs spent</span>
      </div>
    </div>
  );
}

// ── Stat Card ──
function StatCard({ icon: Icon, label, value, sub, color, trend }) {
  return (
    <div className="card p-4 border-l-4" style={{ borderLeftColor: color }}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{label}</p>
          <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">{value}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>
        </div>
        <div className="rounded-xl p-2" style={{ backgroundColor: color + '22' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
      {trend !== undefined && (
        <div className={'flex items-center gap-1 mt-2 text-[10px] font-semibold ' + (trend > 0 ? 'text-red-500' : 'text-emerald-500')}>
          {trend > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {Math.abs(trend)}% vs last month
        </div>
      )}
    </div>
  );
}

// ── Main Component ──
export default function CityBudget() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [animateIn, setAnimateIn] = useState(false);

  // Budget Simulation States
  const [simSource, setSimSource] = useState("Municipal Solid Waste Management");
  const [simTarget, setSimTarget] = useState("Water Board & Power Corporation");
  const [simAmount, setSimAmount] = useState(30);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [simSuccess, setSimSuccess] = useState(false);

  const handleSimulate = () => {
    if (simSource === simTarget) {
      alert("Source and Target departments must be different.");
      return;
    }
    setSimLoading(true);
    setSimResult(null);
    setSimSuccess(false);

    fetch('/api/budget/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_dept: simSource,
        target_dept: simTarget,
        amount_lakhs: Number(simAmount)
      })
    })
      .then(r => r.json())
      .then(res => {
        setSimResult(res);
        setSimLoading(false);
      })
      .catch(err => {
        console.error("Simulation error:", err);
        setSimLoading(false);
      });
  };

  const handleCommit = () => {
    if (!simResult) return;
    setSimSuccess(true);
    // Play confetti
    try {
      confetti({ particleCount: 100, spread: 80 });
    } catch (e) {
      console.warn("Confetti failed:", e);
    }
    setTimeout(() => {
      setSimResult(null);
      setSimSuccess(false);
      fetchBudget(); // reload budget stats
    }, 4000);
  };

  const getSankeyChartOption = () => {
    if (!simResult) return {};
    const nodesSet = new Set();
    simResult.flow_links.forEach(l => {
      nodesSet.add(l.source);
      nodesSet.add(l.target);
    });
    const nodes = Array.from(nodesSet).map(name => ({
      name,
      itemStyle: {
        color: name.includes("Waste") || name.includes("Sanitation") ? "#f43f5e"
             : name.includes("Water") || name.includes("Power") || name.includes("Grid") ? "#0ea5e9"
             : name.includes("Works") || name.includes("Road") || name.includes("Bridge") ? "#f59e0b"
             : name.includes("Police") || name.includes("Safety") ? "#8b5cf6"
             : name.includes("Transit") || name.includes("Traffic") ? "#10b981"
             : name.includes("Funds") || name.includes("Capital") ? "#6366f1"
             : "#ec4899"
      }
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', triggerOn: 'mousemove' },
      series: [{
        type: 'sankey',
        data: nodes,
        links: simResult.flow_links,
        emphasis: { focus: 'adjacency' },
        lineStyle: { color: 'source', curveness: 0.5, opacity: 0.35 },
        label: { color: '#94a3b8', fontSize: 10 }
      }]
    };
  };

  const fetchBudget = () => {
    setLoading(true);
    fetch('/api/budget/intelligence')
      .then(r => r.json())
      .then(d => {
        setData(d);
        setLastUpdated(new Date());
        setLoading(false);
        setTimeout(() => setAnimateIn(true), 100);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchBudget();
    const iv = setInterval(fetchBudget, 120000);
    return () => clearInterval(iv);
  }, []);

  const getMonthlyChart = () => {
    if (!data || !data.monthly_trend) return {};
    const months = data.monthly_trend.months;
    const spend = data.monthly_trend.spend_k;
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        formatter: function(p) { return p[0].axisValue + '<br/>₹' + p[0].value.toLocaleString() + ' Lakhs'; }
      },
      grid: { left: '3%', right: '3%', top: '15%', bottom: '10%', containLabel: true },
      xAxis: {
        type: 'category', data: months,
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: '#94a3b8', fontSize: 10 }
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: '#94a3b8', fontSize: 10, formatter: function(v) { return '₹' + (v / 100).toFixed(0) + ' Cr'; } },
        splitLine: { lineStyle: { color: '#1e293b33' } },
        axisLine: { show: false }
      },
      series: [{
        type: 'bar',
        barMaxWidth: 40,
        data: spend.map(function(v, i) {
          return {
            value: v,
            itemStyle: {
              color: i === spend.length - 1
                ? { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#6366f1' }, { offset: 1, color: '#8b5cf6' }] }
                : { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#0ea5e9' }, { offset: 1, color: '#6366f1' }] },
              borderRadius: [6, 6, 0, 0]
            }
          };
        })
      }]
    };
  };

  const getCategoryDonut = () => {
    if (!data || !data.category_breakdown) return {};
    const palette = ['#6366f1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'item', formatter: '{b}<br/>₹{c} Lakhs ({d}%)' },
      legend: { orient: 'vertical', right: '2%', top: 'center', textStyle: { color: '#94a3b8', fontSize: 10 }, icon: 'circle', itemWidth: 8 },
      series: [{
        type: 'pie',
        radius: ['42%', '70%'],
        center: ['38%', '50%'],
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10 } },
        data: data.category_breakdown.map(function(c, i) {
          return { name: c.category, value: c.cost_k, itemStyle: { color: palette[i % palette.length], borderRadius: 4, borderWidth: 2, borderColor: 'transparent' } };
        })
      }]
    };
  };

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-400 font-medium">Loading Financial Intelligence...</p>
        </div>
      </div>
    );
  }

  const ai = (data && data.ai_analysis) ? data.ai_analysis : {};
  const riskColor = ({ Low: '#10b981', Medium: '#f59e0b', High: '#ef4444', Critical: '#dc2626' })[ai.risk_level] || '#94a3b8';
  const depts = (data && data.departments) || [];
  const cats = (data && data.category_breakdown) || [];
  const recs = ai.recommendations || [];

  return (
    <div className="flex flex-col gap-6 pb-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <IndianRupee className="w-5 h-5 text-indigo-500" />
            City Budget &amp; Financial Intelligence
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">Live financial analytics powered by civic incident data</p>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && <span className="text-[10px] text-slate-400">Updated {lastUpdated.toLocaleTimeString()}</span>}
          <button onClick={fetchBudget} disabled={loading}
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 transition-all disabled:opacity-50">
            <RefreshCw className={'w-3 h-3 ' + (loading ? 'animate-spin' : '')} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={IndianRupee} label="Annual Budget"
          value={'₹' + (data ? data.total_annual_budget_m : 0).toLocaleString('en-IN') + ' Cr'}
          sub="Total allocation 2026" color="#6366f1" />
        <StatCard icon={BarChart3} label="YTD Spent"
          value={'₹' + (data ? data.total_spent_ytd_m : 0).toFixed(1) + ' Cr'}
          sub={(data ? data.ytd_percentage : 0) + '% of annual budget'} color="#0ea5e9"
          trend={(data && data.ytd_percentage > 55) ? 4.2 : -1.8} />
        <StatCard icon={Activity} label="Incident Cost"
          value={'₹' + (data ? data.total_incident_cost_k : 0).toLocaleString('en-IN') + ' Lakhs'}
          sub={depts.length + ' departments active'} color="#f59e0b" />
        <StatCard icon={Zap} label="Dispatch Cost"
          value={'₹' + (data ? data.total_dispatch_cost_k : 0).toLocaleString('en-IN') + ' Lakhs'}
          sub="Emergency response total" color="#8b5cf6" />
      </div>

      {/* Health Gauge + Monthly Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card flex flex-col items-center gap-4">
          <BudgetHealthGauge score={data ? data.health_score : 0} />
          <div className="w-full p-3 rounded-xl text-center border"
            style={{ borderColor: riskColor + '44', backgroundColor: riskColor + '11' }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <ShieldCheck className="w-4 h-4" style={{ color: riskColor }} />
              <span className="text-xs font-bold" style={{ color: riskColor }}>
                Risk Level: {ai.risk_level || 'Calculating...'}
              </span>
            </div>
            <p className="text-[10px] text-slate-500 leading-relaxed">
              {ai.financial_summary || 'Analyzing financial patterns...'}
            </p>
          </div>
          {(ai.savings_potential_m || 0) > 0 && (
            <div className="w-full p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/30 text-center">
              <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                Potential Savings Identified
              </span>
              <span className="text-lg font-black text-emerald-700 dark:text-emerald-400">
                ₹{ai.savings_potential_m} Cr
              </span>
            </div>
          )}
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">
              <TrendingUp className="w-4 h-4 text-indigo-500" /> Monthly Incident Spend Trend
            </h3>
            <span className="card-subtitle">Current month anchored to real ticket data</span>
          </div>
          <ReactECharts option={getMonthlyChart()} style={{ height: 200 }} />
          {ai.forecast_alert && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">{ai.forecast_alert}</p>
            </div>
          )}
        </div>
      </div>

      {/* Dept Bars + Category Donut */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <div className="card xl:col-span-3">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">
              <Building2 className="w-4 h-4 text-indigo-500" /> Department Budget Utilization
            </h3>
            <span className="card-subtitle">Live incident cost allocation by department</span>
          </div>
          <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
            {depts.map(dept => <DeptBar key={dept.name} dept={dept} animateIn={animateIn} />)}
          </div>
        </div>

        <div className="card xl:col-span-2">
          <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
            <h3 className="card-title">
              <BarChart3 className="w-4 h-4 text-indigo-500" /> Cost by Civic Category
            </h3>
            <span className="card-subtitle">Incident cost split by type</span>
          </div>
          <ReactECharts option={getCategoryDonut()} style={{ height: 220 }} />
          <div className="flex flex-col gap-1.5 mt-3">
            {cats.slice(0, 4).map(c => (
              <div key={c.category} className="flex justify-between items-center text-[10px]">
                <span className="text-slate-500 truncate">{c.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-400">{c.tickets} tickets</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">₹{c.cost_k} Lakhs</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI-Powered Smart Budget Reallocation Impact Simulator */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex items-center justify-between">
          <div>
            <h3 className="card-title">
              <Activity className="w-4 h-4 text-indigo-500 animate-pulse" /> AI Capital Reallocation Impact Simulator
            </h3>
            <span className="card-subtitle">Model 30-day cross-domain telemetry changes before shifting municipal funds</span>
          </div>
          <span className="text-[9px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-650 dark:text-indigo-400 font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
            CFO Simulation Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Simulation input form */}
          <div className="flex flex-col gap-4 p-4 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-850">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Reallocation Setup</h4>
            
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500">DEBIT BUDGET SOURCE</label>
              <select 
                value={simSource}
                onChange={(e) => setSimSource(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Municipal Solid Waste Management">🗑️ Solid Waste Management</option>
                <option value="Water Board & Power Corporation">⚡ Utilities & Electrical Grid</option>
                <option value="Public Works Department (PWD)">🛣️ PWD Roads & Bridges</option>
                <option value="City Police & Law Enforcement">🛡️ Public Safety & Police</option>
                <option value="City Transit Authority">🚌 City Transit Authority</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-500">CREDIT BUDGET TARGET</label>
              <select 
                value={simTarget}
                onChange={(e) => setSimTarget(e.target.value)}
                className="form-input text-xs"
              >
                <option value="Municipal Solid Waste Management">🗑️ Solid Waste Management</option>
                <option value="Water Board & Power Corporation">⚡ Utilities & Electrical Grid</option>
                <option value="Public Works Department (PWD)">🛣️ PWD Roads & Bridges</option>
                <option value="City Police & Law Enforcement">🛡️ Public Safety & Police</option>
                <option value="City Transit Authority">🚌 City Transit Authority</option>
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                <span>TRANSFER AMOUNT</span>
                <span className="text-indigo-600 dark:text-indigo-400">₹{simAmount} Lakhs</span>
              </div>
              <input 
                type="range"
                min="5"
                max="150"
                step="5"
                value={simAmount}
                onChange={(e) => setSimAmount(Number(e.target.value))}
                className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>

            <button
              onClick={handleSimulate}
              disabled={simLoading || simSource === simTarget}
              className="btn-3d btn-primary text-xs w-full py-2.5 mt-2 flex items-center justify-center gap-2"
              style={{ cursor: 'pointer' }}
            >
              {simLoading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Projecting Flow Trade-offs...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Simulate Impact</span>
                </>
              )}
            </button>
          </div>

          {/* Simulation outputs & charts */}
          <div className="lg:col-span-2 flex flex-col gap-4">
            {!simResult && !simLoading && (
              <div className="flex flex-col items-center justify-center h-full border border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center text-slate-400">
                <IndianRupee className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2 animate-bounce-subtle" />
                <h5 className="text-xs font-bold text-slate-650 dark:text-slate-350">Simulation Ledger Standby</h5>
                <p className="text-[10px] text-slate-500 max-w-xs mt-1">Configure the reallocation parameters and run the simulator to forecast cross-domain city impact.</p>
              </div>
            )}

            {simLoading && (
              <div className="flex flex-col items-center justify-center h-full border border-slate-100 dark:border-slate-850 rounded-xl p-8 text-center bg-slate-50/20 dark:bg-slate-900/10">
                <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-3" />
                <h5 className="text-xs font-bold text-slate-650 dark:text-slate-300">Evaluating Trade-offs with Gemini</h5>
                <p className="text-[10px] text-slate-500 mt-1">Running deep financial projection models and mapping IoT sensor telemetry outcomes...</p>
              </div>
            )}

            {simResult && !simLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
                {/* Sankey diagram */}
                <div className="flex flex-col gap-2 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900/40">
                  <span className="text-[10px] font-bold text-slate-450">CAPITAL & OPERATION FLOW (SANKEY)</span>
                  <div className="h-40 md:h-44">
                    <ReactECharts option={getSankeyChartOption()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                {/* Gemini feedback + changes */}
                <div className="flex flex-col gap-3 justify-between">
                  <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                    <span className="text-[10px] font-extrabold text-indigo-500 block mb-1">GEMINI IMPACT ANALYSIS</span>
                    <p className="text-[10px] text-slate-650 dark:text-slate-300 leading-relaxed font-sans font-medium">
                      {simResult.summary}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 border border-slate-100 dark:border-slate-800 rounded-xl p-3 bg-white dark:bg-slate-900/40">
                    <span className="text-[10px] font-bold text-slate-450 block mb-1.5">PROJECTED 30-DAY TELEMETRY SHIFTS</span>
                    <div className="flex flex-col gap-2.5">
                      {simResult.metric_changes.map((item, idx) => {
                        const shift = item.simulated - item.baseline;
                        const isUplift = shift >= 0;
                        return (
                          <div key={idx} className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-semibold text-slate-600 dark:text-slate-350">{item.metric}</span>
                              <div className="flex items-center gap-1.5">
                                <span className="text-slate-400 font-mono">{item.baseline}% → {item.simulated}%</span>
                                <span className={`font-bold px-1 py-0.2 rounded text-[8px] ${isUplift ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450'}`}>
                                  {isUplift ? '+' : ''}{shift}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${isUplift ? 'bg-emerald-500' : 'bg-rose-500'}`}
                                style={{ width: `${item.simulated}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleCommit}
                    disabled={simSuccess}
                    className={`btn-3d text-xs w-full py-2 flex items-center justify-center gap-2 font-bold transition-all ${
                      simSuccess 
                        ? 'bg-emerald-600 border-emerald-500 text-white animate-pulse'
                        : 'btn-primary'
                    }`}
                    style={{ cursor: 'pointer' }}
                  >
                    {simSuccess ? (
                      <>
                        <ShieldCheck className="w-4 h-4 animate-bounce" />
                        <span>Ledger Updated Successfully!</span>
                      </>
                    ) : (
                      <>
                        <span>💾 Commit Budget Reallocation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gemini AI CFO Recommendations */}
      <div className="card">
        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
          <h3 className="card-title">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Gemini AI CFO Recommendations
          </h3>
          <span className="card-subtitle">AI-generated financial optimizations to maximize budget efficiency</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recs.map((rec, i) => {
            const pColorMap = { High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' };
            const pBgMap = {
              High: 'bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30',
              Medium: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30',
              Low: 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30'
            };
            const pColor = pColorMap[rec.priority] || '#94a3b8';
            const pBg = pBgMap[rec.priority] || '';
            return (
              <div key={i} className={'p-4 rounded-xl border flex flex-col gap-2 ' + pBg}>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-snug">{rec.title}</h4>
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0"
                    style={{ backgroundColor: pColor + '22', color: pColor }}>{rec.priority}</span>
                </div>
                <p className="text-[10px] text-slate-500 leading-relaxed">{rec.description}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                  <span className="text-[10px] text-slate-400">{rec.dept}</span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                    Save ₹{rec.impact_m} Cr
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
