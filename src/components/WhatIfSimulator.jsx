import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Sliders } from 'lucide-react';


export default function WhatIfSimulator() {
  const [params, setParams] = useState({
    busTransit: 0,       // -20 to +100%
    signalTimer: 0,      // 0 to +60 seconds
    emergencyTeams: 40,  // 20 to 100 teams
    solarFunding: 10,    // 0 to 50 $M
    congestionToll: 0    // $0 to $20
  });

  const [metrics, setMetrics] = useState({
    safety: 82,
    emissions: 100, // baseline index
    delays: 48, // mins average peak delay
    satisfaction: 74,
    budget: 45 // $M available
  });

  // Re-calculate projected metrics when policy params change
  useEffect(() => {
    // Math equations representing urban relationships
    const deltaTransit = params.busTransit / 100;
    const deltaSignals = params.signalTimer / 60;
    const deltaTeams = (params.emergencyTeams - 40) / 40;
    const deltaSolar = (params.solarFunding - 10) / 10;
    const deltaToll = params.congestionToll / 20;

    const safety = Math.round(Math.min(99, Math.max(30, 82 + deltaTeams * 12 + deltaTransit * 3 - deltaSignals * 2)));
    const emissions = Math.round(Math.max(40, 100 - deltaTransit * 22 - deltaSolar * 15 - deltaToll * 18));
    const delays = Math.round(Math.max(5, 48 - deltaTransit * 12 - deltaSignals * 8 - deltaToll * 20));
    const satisfaction = Math.round(Math.min(99, Math.max(20, 74 + deltaTransit * 8 + deltaTeams * 6 - deltaToll * 10 + deltaSolar * 5)));
    const budget = Math.round(Math.max(0, 45 - deltaTransit * 15 - deltaSolar * 8 - deltaTeams * 4 + deltaToll * 12));

    setMetrics({ safety, emissions, delays, satisfaction, budget });
  }, [params]);

  const handleSliderChange = (key, val) => {
    setParams(prev => ({ ...prev, [key]: parseFloat(val) }));
  };

  // Prepare data for ECharts (24-hour congestion curve simulation)
  const getChartOptions = () => {
    const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`);
    
    // Baseline congestion curve (double peak: 8 AM, 6 PM)
    const baseline = [15, 12, 10, 15, 30, 55, 82, 95, 88, 70, 55, 52, 58, 55, 50, 62, 85, 98, 90, 75, 50, 35, 22, 18];
    
    // Simulate active policy effects on the curve
    const simulated = baseline.map((val, idx) => {
      // Impact is highest during peak hours (hours 7-9 and 16-19)
      const isPeak = (idx >= 7 && idx <= 9) || (idx >= 16 && idx <= 19);
      let reductionCoeff = 1.0;
      
      // Transit frequency reduces peak congestion
      reductionCoeff -= (params.busTransit / 100) * 0.12;
      // Signal timing reduces congestion (both peak and non-peak)
      reductionCoeff -= (params.signalTimer / 60) * 0.08;
      // Congestion toll reduces peak congestion strongly
      if (isPeak) {
        reductionCoeff -= (params.congestionToll / 20) * 0.22;
      } else {
        reductionCoeff -= (params.congestionToll / 20) * 0.05;
      }
      
      const newVal = Math.round(val * Math.max(0.2, reductionCoeff));
      return newVal;
    });

    return {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        textStyle: { color: '#0f172a' }
      },
      legend: {
        data: ['Current Baseline', 'Simulated Policy Outlook'],
        textStyle: { color: 'inherit' },
        bottom: 0
      },
      grid: {
        left: '4%',
        right: '4%',
        top: '12%',
        bottom: '12%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: hours,
        axisLine: { lineStyle: { color: '#94a3b8' } }
      },
      yAxis: {
        type: 'value',
        name: 'Congestion %',
        min: 0,
        max: 100,
        axisLine: { lineStyle: { color: '#94a3b8' } }
      },
      series: [
        {
          name: 'Current Baseline',
          type: 'line',
          data: baseline,
          smooth: true,
          lineStyle: { width: 2, type: 'dashed', color: '#94a3b8' },
          itemStyle: { color: '#94a3b8' }
        },
        {
          name: 'Simulated Policy Outlook',
          type: 'line',
          data: simulated,
          smooth: true,
          lineStyle: { width: 3, color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
                { offset: 1, color: 'rgba(37, 99, 235, 0.01)' }
              ]
            }
          },
          itemStyle: { color: '#2563eb' }
        }
      ]
    };
  };

  return (
    <div className="card">
      <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3" style={{ marginBottom: '1.5rem' }}>
        <h3 className="card-title">
          <Sliders className="w-5 h-5 text-blue-600" /> What-If Policy Scenario Simulator
        </h3>
        <span className="card-subtitle">Test and predict the systemic impact of municipal policy decisions before implementation</span>
      </div>

      <div className="simulator-layout">
        {/* Sliders Control Column */}
        <div className="simulator-controls border-r border-slate-100 dark:border-slate-800 pr-4">
          <div className="slider-group">
            <div className="slider-label">
              <span>Bus Fleet Frequency</span>
              <span className="font-mono text-blue-600 font-bold">
                {params.busTransit >= 0 ? `+${params.busTransit}` : params.busTransit}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="100"
              step="5"
              value={params.busTransit}
              onChange={(e) => handleSliderChange('busTransit', e.target.value)}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Signal Green Phase Offset</span>
              <span className="font-mono text-blue-600 font-bold">+{params.signalTimer}s</span>
            </div>
            <input
              type="range"
              min="0"
              max="60"
              step="5"
              value={params.signalTimer}
              onChange={(e) => handleSliderChange('signalTimer', e.target.value)}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Emergency Personnel Count</span>
              <span className="font-mono text-blue-600 font-bold">{params.emergencyTeams} Units</span>
            </div>
            <input
              type="range"
              min="20"
              max="100"
              step="5"
              value={params.emergencyTeams}
              onChange={(e) => handleSliderChange('emergencyTeams', e.target.value)}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Solar Grid Subsidies</span>
              <span className="font-mono text-blue-600 font-bold">${params.solarFunding}M</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="2"
              value={params.solarFunding}
              onChange={(e) => handleSliderChange('solarFunding', e.target.value)}
              className="slider-input"
            />
          </div>

          <div className="slider-group">
            <div className="slider-label">
              <span>Peak-Hours Congestion Toll</span>
              <span className="font-mono text-blue-600 font-bold">${params.congestionToll}</span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="2"
              value={params.congestionToll}
              onChange={(e) => handleSliderChange('congestionToll', e.target.value)}
              className="slider-input"
            />
          </div>
        </div>

        {/* Analytics Output Column */}
        <div className="flex flex-col gap-6 pl-2">
          {/* Output KPI Metric Swatches */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Safety Index</span>
              <span className="text-xl font-bold mt-1 font-mono">{metrics.safety}%</span>
              <span className={`text-[10px] font-bold mt-1 ${metrics.safety >= 80 ? 'text-emerald-600' : 'text-red-500'}`}>
                {metrics.safety >= 82 ? 'Optimal response' : 'High risk load'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Carbon Emissions</span>
              <span className="text-xl font-bold mt-1 font-mono">{metrics.emissions}%</span>
              <span className={`text-[10px] font-bold mt-1 ${metrics.emissions <= 90 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {metrics.emissions < 100 ? `${100 - metrics.emissions}% reduction` : 'Base emissions'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Peak Commute Delay</span>
              <span className="text-xl font-bold mt-1 font-mono">{metrics.delays}m</span>
              <span className={`text-[10px] font-bold mt-1 ${metrics.delays < 48 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {metrics.delays < 48 ? `${48 - metrics.delays} mins saved` : 'Base delays'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Citizen Satisfaction</span>
              <span className="text-xl font-bold mt-1 font-mono">{metrics.satisfaction}%</span>
              <span className={`text-[10px] font-bold mt-1 ${metrics.satisfaction >= 74 ? 'text-emerald-600' : 'text-red-500'}`}>
                {metrics.satisfaction > 74 ? `+${metrics.satisfaction - 74}% increase` : 'Base rating'}
              </span>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Municipal Budget</span>
              <span className="text-xl font-bold mt-1 font-mono">${metrics.budget}M</span>
              <span className={`text-[10px] font-bold mt-1 ${metrics.budget >= 30 ? 'text-blue-500' : 'text-red-500'}`}>
                {metrics.budget >= 45 ? 'Surplus' : 'Deficit risk'}
              </span>
            </div>
          </div>

          {/* ECharts visualization */}
          <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800 p-3 rounded-xl" style={{ height: '300px' }}>
            <ReactECharts 
              option={getChartOptions()} 
              style={{ height: '100%', width: '100%' }}
              opts={{ renderer: 'canvas' }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
