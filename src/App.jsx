import { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Moon, 
  Sun, 
  Bot, 
  Car, 
  FileText,
  CloudSun,
  Camera,
  Wind,
  Radio,
  Volume2,
  FileDown,
  HeartPulse
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

import DigitalTwin from './components/DigitalTwin';
import AICopilot from './components/AICopilot';
import WhatIfSimulator from './components/WhatIfSimulator';
import MultiAgentStatus from './components/MultiAgentStatus';
import WorkflowTracker from './components/WorkflowTracker';
import SenateChamber from './components/SenateChamber';
import DispatchControl from './components/DispatchControl';
import SentimentPulse from './components/SentimentPulse';

const initialTickets = [
  {
    id: 'LND-9482',
    title: 'Pothole on Piccadilly Circus roundabout',
    category: 'Roads & Bridges',
    priority: 'Medium',
    status: 'In Progress',
    department: 'Transport for London',
    officer: 'Marcus Vance',
    submittedAt: 'Jul 06, 2026, 09:30 AM',
    stage: 3
  },
  {
    id: 'LND-9388',
    title: 'Water main leakage near Hyde Park exit',
    category: 'Utilities & Lighting',
    priority: 'High',
    status: 'Resolved',
    department: 'Thames Water',
    officer: 'Elena Rostova',
    submittedAt: 'Jul 05, 2026, 02:15 PM',
    stage: 4
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  
  // API states
  const [liveWeather, setLiveWeather] = useState(null);
  const [liveAqi, setLiveAqi] = useState(null);
  const [liveTransport, setLiveTransport] = useState([]);
  const [liveMarket, setLiveMarket] = useState(null);
  const [liveNews, setLiveNews] = useState([]);
  const [tickets, setTickets] = useState(initialTickets);
  const [telemetry, setTelemetry] = useState([]);
  const [senatePolicy, setSenatePolicy] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [aqiForecast, setAqiForecast] = useState(null);
  
  // Voice Briefing States & Handlers
  const [isSpeaking, setIsSpeaking] = useState(false);
  const synthRef = useRef(window.speechSynthesis);
  const utteranceRef = useRef(null);

  const toggleVoiceBriefing = () => {
    if (isSpeaking) {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
      setIsSpeaking(false);
      return;
    }

    setSystemLogs(prev => [`Citizen Agent: Initiating AI Voice Briefing generator...`, ...prev]);
    fetch('/api/briefing/generate')
      .then(res => res.json())
      .then(data => {
        const script = data.briefing;
        setSystemLogs(prev => [`Citizen Agent: AI Operational voice briefing ready.`, ...prev]);

        if (synthRef.current) {
          synthRef.current.cancel();
          const utterance = new SpeechSynthesisUtterance(script);
          const voices = synthRef.current.getVoices();
          const enVoice = voices.find(v => v.lang.includes('GB') || v.lang.includes('EN') || v.name.includes('Google'));
          if (enVoice) {
            utterance.voice = enVoice;
          }
          utterance.rate = 0.95;

          utterance.onend = () => {
            setIsSpeaking(false);
          };
          utterance.onerror = () => {
            setIsSpeaking(false);
          };

          utteranceRef.current = utterance;
          setIsSpeaking(true);
          synthRef.current.speak(utterance);
        }
      })
      .catch(err => {
        console.error("Voice briefing failed:", err);
        setSystemLogs(prev => [`System Error: Failed to generate audio briefing script.`, ...prev]);
      });
  };

  const downloadAuditPdf = () => {
    setSystemLogs(prev => [`Citizen Agent: Generating and exporting municipal audit PDF...`, ...prev]);
    const link = document.createElement('a');
    link.href = '/api/audit/pdf';
    link.download = 'london_municipal_audit_report.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Form State
  const [complaintForm, setComplaintForm] = useState({
    title: '',
    category: 'Roads & Bridges',
    priority: 'Medium',
    description: ''
  });

  const [systemLogs, setSystemLogs] = useState([
    "Traffic Agent: Westminster Grid monitoring initialized.",
    "Transit Agent: TfL line statuses synced.",
    "Safety Agent: OpenStreetMap interactive node layers ready."
  ]);

  // Load all live APIs from proxy endpoints
  const loadLiveData = () => {
    Promise.all([
      fetch('/api/live/weather').then(res => res.json()).catch(() => null),
      fetch('/api/live/aqi').then(res => res.json()).catch(() => null),
      fetch('/api/live/transport').then(res => res.json()).catch(() => []),
      fetch('/api/live/market').then(res => res.json()).catch(() => null),
      fetch('/api/live/news').then(res => res.json()).catch(() => []),
      fetch('/api/tickets').then(res => res.json()).catch(() => null),
      fetch('/api/telemetry').then(res => res.json()).catch(() => []),
      fetch('/api/actions').then(res => res.json()).catch(() => []),
      fetch('/api/live/aqi/forecast').then(res => res.json()).catch(() => null)
    ]).then(([weather, aqi, transport, market, news, dbTickets, telemetryData, actionsData, aqiForecastData]) => {
      if (weather) setLiveWeather(weather);
      if (aqi) setLiveAqi(aqi);
      if (transport && transport.length > 0) setLiveTransport(transport);
      if (market) setLiveMarket(market);
      if (news && news.length > 0) setLiveNews(news);
      if (telemetryData && telemetryData.length > 0) setTelemetry(telemetryData);
      if (actionsData) setActionHistory(actionsData);
      if (aqiForecastData) setAqiForecast(aqiForecastData);
      if (dbTickets) {
        setTickets(dbTickets);
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(false);
      }
    });
  };

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  // Handle dark mode toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  const executeCopilotAction = (actionName) => {
    const impactDescription = actionName.includes("Piccadilly") || actionName.includes("traffic")
      ? "Green offset adjusted on Piccadilly Circus roundabout."
      : actionName.includes("Waterloo") || actionName.includes("water")
      ? "Mobile water tanker and suction carrier deployed to Waterloo Road."
      : "Dispatched routine resolution crew.";

    fetch('/api/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action_name: actionName,
        impact: impactDescription
      })
    })
      .then(() => loadLiveData())
      .catch(err => console.error("Failed to log action:", err));

    setSystemLogs(prev => [`Safety Agent: Executive Command: "${actionName}"`, ...prev]);
    
    // Create custom dynamic incident pin on map based on prompt
    if (actionName.includes("Piccadilly") || actionName.includes("traffic")) {
      setActiveIncident({
        title: "Traffic Alert Dispatched",
        description: "Green offset adjusted on Piccadilly Circus roundabout.",
        lat: 51.5101,
        lon: -0.1349
      });
      confetti({ particleCount: 60, spread: 40 });
    } else if (actionName.includes("Waterloo") || actionName.includes("water")) {
      setActiveIncident({
        title: "Burst Main Recovery Dispatched",
        description: "Mobile water tanker and suction carrier deployed to Waterloo Road.",
        lat: 51.5033,
        lon: -0.1123
      });
      confetti({ particleCount: 60, spread: 40 });
    }
  };

  const handleComplaintSubmit = (e) => {
    e.preventDefault();
    if (!complaintForm.title.trim() || !complaintForm.description.trim()) return;

    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(complaintForm)
    })
      .then(res => res.json())
      .then(createdTicket => {
        setTickets(prev => [createdTicket, ...prev]);
        setComplaintForm({ title: '', category: 'Roads & Bridges', priority: 'Medium', description: '' });
        setSystemLogs(prev => [`[Database Sync] Ticket ${createdTicket.id} classified by Gemini. Routing to ${createdTicket.department}...`, ...prev]);
        confetti({ particleCount: 80, spread: 60 });
      })
      .catch(err => {
        console.error("Failed to submit ticket to backend:", err);
        const deptMap = {
          'Roads & Bridges': 'Transport for London',
          'Utilities & Lighting': 'Thames Water & Power Grid',
          'Public Safety': 'Metropolitan Police Service',
          'Environmental': 'London Environment Agency',
          'Transport': 'Transport for London',
          'Social Services': 'London Borough Services',
        };
        const fallbackTicket = {
          id: `LND-${Math.random().toString(16).slice(2,6).toUpperCase()}`,
          title: complaintForm.title,
          category: complaintForm.category,
          priority: complaintForm.priority,
          status: 'Submission Received',
          department: deptMap[complaintForm.category] || 'London City Council',
          officer: 'Auto-Assigned',
          submittedAt: new Date().toISOString(),
          stage: 0,
          description: complaintForm.description
        };
        setTickets(prev => [fallbackTicket, ...prev]);
        setComplaintForm({ title: '', category: 'Roads & Bridges', priority: 'Medium', description: '' });
        setSystemLogs(prev => [`[Offline Sandbox] Local ticket ${fallbackTicket.id} registered.`, ...prev]);
        confetti({ particleCount: 80, spread: 60 });
      });
  };

  const getForecastChart = () => {
    const days = aqiForecast?.days || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const pm25Data = aqiForecast?.pm2_5 || [12, 14, 18, 11, 9, 15, 8];
    const no2Data = aqiForecast?.nitrogen_dioxide || [24, 28, 32, 21, 18, 30, 22];
    const pm10Data = aqiForecast?.pm10 || [18, 21, 24, 17, 15, 22, 14];

    return {
      tooltip: { trigger: 'axis' },
      legend: { data: ['PM2.5 (µg/m³)', 'PM10 (µg/m³)', 'Nitrogen Dioxide (µg/m³)'], bottom: 0 },
      grid: { left: '3%', right: '3%', top: '8%', bottom: '12%', containLabel: true },
      xAxis: { type: 'category', data: days },
      yAxis: { type: 'value' },
      series: [
        { name: 'PM2.5 (µg/m³)', type: 'line', data: pm25Data, smooth: true, itemStyle: { color: '#ea580c' } },
        { name: 'PM10 (µg/m³)', type: 'line', data: pm10Data, smooth: true, itemStyle: { color: '#10b981' } },
        { name: 'Nitrogen Dioxide (µg/m³)', type: 'bar', data: no2Data, itemStyle: { color: '#6366f1' } }
      ]
    };
  };

  const getMarketChartOption = () => {
    if (!liveMarket || !liveMarket.points || liveMarket.points.length === 0) {
      return {
        xAxis: { type: 'category', data: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'], show: false },
        yAxis: { type: 'value', min: 10600, show: false },
        grid: { top: 5, bottom: 5, left: 5, right: 5 },
        series: [{ type: 'line', data: [10610, 10625, 10615, 10630, 10620, 10644, 10640, 10645], color: '#3b82f6', smooth: true, showSymbol: false }]
      };
    }
    const times = liveMarket.points.map(p => new Date(p.time * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    const values = liveMarket.points.map(p => p.value);
    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '2%', right: '2%', top: '5%', bottom: '5%', containLabel: true },
      xAxis: { type: 'category', data: times, show: false },
      yAxis: { type: 'value', min: Math.min(...values) - 5, max: Math.max(...values) + 5, show: true },
      series: [{
        name: 'FTSE 100',
        type: 'line',
        data: values,
        smooth: true,
        showSymbol: false,
        color: '#2563eb',
        lineStyle: { width: 2 }
      }]
    };
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo flex items-center gap-2">
          <span>🏙️ CivicMind AI</span>
        </div>

        {/* User profile details matching spec */}
        <div className="flex flex-col items-center gap-2 py-4 border-b border-slate-150/10">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Al-Amin Lousa" />
          </div>
          <div className="text-center">
            <div className="font-bold text-xs text-slate-800 dark:text-slate-200">Al-Amin Lousa</div>
            <div className="text-[10px] text-slate-450">City Administrator</div>
          </div>
        </div>
        
        <ul className="sidebar-menu mt-4">
          <li className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('overview')}>
              <Building2 className="w-4 h-4" /> Overview
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'transportations' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('transportations')}>
              <Car className="w-4 h-4" /> Transportations
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'traffic' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('traffic')}>
              <Camera className="w-4 h-4" /> Traffic & Map
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'weather' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('weather')}>
              <CloudSun className="w-4 h-4" /> Weather & Forecast
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'news' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('news')}>
              <FileText className="w-4 h-4" /> News & Media
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'others' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('others')}>
              <Users className="w-4 h-4" /> Actuators & Analytics
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'pulse' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('pulse')}>
              <HeartPulse className="w-4 h-4" /> Sentiment Pulse
            </button>
          </li>
        </ul>

        {/* Action button triggers */}
        <div className="mt-auto flex flex-col gap-3 pt-4 border-t border-slate-150/10">
          <button 
            onClick={() => setIsCopilotOpen(true)}
            className="btn-3d btn-primary flex items-center justify-center gap-2 w-full"
          >
            <Bot className="w-4 h-4 animate-bounce" />
            <span>Ask AI Copilot</span>
          </button>
          
          <button 
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="btn-3d btn-secondary flex items-center justify-center gap-2"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.06)', color: '#000000', border: '1px solid rgba(255, 255, 255, 0.12)', width: '100%' }}
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <button 
            onClick={downloadAuditPdf}
            className="btn-3d flex items-center justify-center gap-2 text-white border border-indigo-700/50 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 transition-all duration-300 w-full"
            style={{ fontSize: '11px', fontWeight: '600', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer' }}
          >
            <FileDown className="w-4 h-4 animate-bounce" />
            <span>Export Audit PDF</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="main-content">
        {/* HEADER BAR WITH CITY SELECTOR & SEARCH */}
        <header className="header-bar">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">Change City:</span>
              <select className="form-input py-1 text-xs font-semibold" style={{ width: 'auto' }}>
                <option value="london">London (United Kingdom)</option>
              </select>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Search ticket, cameras..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input py-1 text-xs" 
                style={{ width: '220px' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs text-slate-500 font-semibold font-mono">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </span>
            <div className="flex items-center gap-3">
              <button
                onClick={toggleVoiceBriefing}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold font-sans transition-all duration-300 ${
                  isSpeaking 
                    ? 'border-rose-500/20 bg-rose-500/10 text-rose-600 dark:text-rose-400 animate-pulse'
                    : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'
                }`}
                style={{ cursor: 'pointer' }}
              >
                {isSpeaking ? (
                  <Radio className="w-3.5 h-3.5 text-rose-500 animate-pulse" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-indigo-500" />
                )}
                <span>{isSpeaking ? "Stop Briefing" : "Play Voice Briefing"}</span>
              </button>
              
              <div className="flex items-center gap-1.5">
                <span className={`dot-indicator ${isBackendOnline ? 'dot-success animate-pulse' : 'dot-warning'}`}></span>
                <span className="text-[10px] font-bold text-slate-450 uppercase">{isBackendOnline ? 'API Sync Live' : 'Fallback Sandbox'}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="content-body animate-fade-in">
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-6">
              {/* Weather Station Summary Card */}
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title"><CloudSun className="w-5 h-5 text-sky-500" /> Weather Station (London Central)</h3>
                  <span className="card-subtitle">Live meteorological readings from the Open-Meteo network</span>
                </div>
                {liveWeather ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Temperature</div>
                      <div className="text-xl font-bold font-mono text-indigo-650">{liveWeather.current.temperature_2m}°C</div>
                      <div className="text-[9px] text-slate-450">Apparent: {liveWeather.current.apparent_temperature}°C</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Wind Speed</div>
                      <div className="text-xl font-bold font-mono text-emerald-600">{liveWeather.current.wind_speed_10m} km/h</div>
                      <div className="text-[9px] text-slate-450">Direction: {liveWeather.current.wind_direction_10m}°</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Humidity</div>
                      <div className="text-xl font-bold font-mono text-amber-500">{liveWeather.current.relative_humidity_2m}%</div>
                      <div className="text-[9px] text-slate-450">Precipitation: {liveWeather.current.precipitation} mm</div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-850 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Air Quality (AQI)</div>
                      <div className="text-xl font-bold font-mono text-rose-500">{liveAqi?.current?.pm2_5 || 12} µg/m³</div>
                      <div className="text-[9px] text-slate-450">PM10: {liveAqi?.current?.pm10 || 18} µg/m³</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading Live Open-Meteo telemetry...</div>
                )}
              </div>

              {/* Map & Transport Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 min-h-[400px]">
                  <DigitalTwin 
                    nodesList={telemetry}
                    onSelectNode={(node) => {
                      if (node.action === 'dispatch') {
                        setSystemLogs(prev => [`Safety Agent: [Emergency Command] Field dispatch team deployed to: ${node.name}`, ...prev]);
                        confetti({ particleCount: 80, spread: 60 });
                      } else {
                        setSystemLogs(prev => [`Traffic Agent: Selected map telemetry: ${node.name}`, ...prev]);
                      }
                    }}
                    activeIncident={activeIncident}
                  />
                </div>
                
                {/* Transit line status list card */}
                <div className="card flex flex-col justify-between">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title"><Car className="w-5 h-5 text-indigo-600" /> Tube Transit Network</h3>
                    <span className="card-subtitle">Real-time status updates from Transport for London (TfL)</span>
                  </div>
                  
                  {liveTransport && liveTransport.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1">
                      {liveTransport.map(line => {
                        const status = line.lineStatuses[0]?.statusSeverityDescription || 'Good Service';
                        const isGood = status === 'Good Service';
                        const isWarning = status.includes('Delay') || status.includes('Reduced');
                        let badgeClass = 'status-good';
                        if (isWarning) badgeClass = 'status-warning';
                        else if (!isGood) badgeClass = 'status-danger';

                        const lineColors = {
                          bakerloo: '#ae6017',
                          central: '#e32017',
                          circle: '#ffd300',
                          district: '#00782a',
                          hammersmith: '#f15b2e',
                          jubilee: '#868f98',
                          metropolitan: '#9b0056',
                          northern: '#000000',
                          piccadilly: '#003688',
                          victoria: '#00a4e4',
                          waterloo: '#95cdba'
                        };
                        const lineColor = lineColors[line.id] || '#475569';

                        return (
                          <div key={line.id} className="transport-line-item">
                            <span className="line-badge" style={{ backgroundColor: lineColor }}>{line.name}</span>
                            <span className={`status-badge ${badgeClass}`}>{status}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2">
                      {['Central', 'Victoria', 'Northern', 'District', 'Jubilee'].map(line => (
                        <div key={line} className="transport-line-item">
                          <span className="font-bold text-xs">{line} Line</span>
                          <span className="status-badge status-good">Good Service</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Share Market & Attractions Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FTSE 100 Live card */}
                <div className="card lg:col-span-2">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
                    <div>
                      <h3 className="card-title"><TrendingUp className="w-5 h-5 text-indigo-600" /> Share Market (FTSE 100)</h3>
                      <span className="card-subtitle">Live market data from Yahoo Finance ticker</span>
                    </div>
                    {liveMarket && (
                      <div className="text-right">
                        <div className="font-bold font-mono text-lg text-indigo-650">{liveMarket.price.toLocaleString()}</div>
                        <div className={`text-[10px] font-bold ${liveMarket.price >= liveMarket.previousClose ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {liveMarket.price >= liveMarket.previousClose ? '▲' : '▼'} {((liveMarket.price - liveMarket.previousClose) / liveMarket.previousClose * 100).toFixed(2)}%
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="h-[200px]">
                    <ReactECharts option={getMarketChartOption()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                {/* News preview widget */}
                <div className="card">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title"><FileText className="w-5 h-5 text-blue-600" /> News Feed</h3>
                    <span className="card-subtitle">Live BBC London Local News</span>
                  </div>
                  <div className="flex flex-col gap-3 max-h-[200px] overflow-y-auto pr-1">
                    {liveNews && liveNews.slice(0, 3).map((art, idx) => (
                      <a key={idx} href={art.link} target="_blank" rel="noopener noreferrer" className="p-2 border border-slate-100 dark:border-slate-800 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-850 transition-colors block">
                        <div className="font-bold text-xs text-slate-850 dark:text-slate-150 line-clamp-1">{art.title}</div>
                        <div className="text-[10px] text-slate-450 mt-1">{art.pubDate}</div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRANSPORTATIONS */}
          {activeTab === 'transportations' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-150">
                  <div className="card-header pb-2">
                    <h4 className="font-bold text-sm text-indigo-800 dark:text-indigo-400">Total Buses in Service</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-2">8,522</div>
                  <button className="btn btn-primary mt-4 py-1.5 text-xs">Book Transit Ticket</button>
                </div>
                <div className="card bg-sky-50/50 dark:bg-sky-950/20 border-sky-150">
                  <div className="card-header pb-2">
                    <h4 className="font-bold text-sm text-sky-800 dark:text-sky-400">Total Trains in Service</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-2">508</div>
                  <button className="btn btn-primary mt-4 py-1.5 text-xs" style={{ backgroundColor: '#0284c7' }}>Book Rail Ticket</button>
                </div>
                <div className="card bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-150">
                  <div className="card-header pb-2">
                    <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Active Bicycles LBH</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">4,195</div>
                  <div className="text-[10px] text-slate-450 mt-4">London Cycle Hire: 84% Stations Occupied</div>
                </div>
              </div>

              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title">Full Tube Status Board</h3>
                </div>
                {liveTransport && liveTransport.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {liveTransport.map(line => {
                      const status = line.lineStatuses[0]?.statusSeverityDescription || 'Good Service';
                      const isGood = status === 'Good Service';
                      const isWarning = status.includes('Delay') || status.includes('Reduced');
                      let badgeClass = 'status-good';
                      if (isWarning) badgeClass = 'status-warning';
                      else if (!isGood) badgeClass = 'status-danger';

                      return (
                        <div key={line.id} className="transport-line-item">
                          <span className="font-bold text-xs text-slate-850 dark:text-slate-150">{line.name}</span>
                          <span className={`status-badge ${badgeClass}`}>{status}</span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading TfL tube statuses...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: TRAFFIC */}
          {activeTab === 'traffic' && (
            <div className="flex flex-col gap-6">
              <div className="h-[450px]">
                <DigitalTwin 
                  nodesList={telemetry}
                  activeTickets={tickets}
                  onEmergencyDispatch={loadLiveData}
                  onSelectNode={(node) => {
                    if (node.action === 'dispatch') {
                      setSystemLogs(prev => [`Safety Agent: [Emergency Command] Field dispatch team deployed to: ${node.name}`, ...prev]);
                      confetti({ particleCount: 80, spread: 60 });
                    } else if (node.type === 'emergency') {
                      setSystemLogs(prev => [`Safety Agent: Querying emergency hub: ${node.name}`, ...prev]);
                    } else {
                      setSystemLogs(prev => [`Traffic Agent: Selected traffic node: ${node.name}`, ...prev]);
                    }
                  }}
                  activeIncident={activeIncident}
                />
              </div>

              {/* Traffic Cameras and Images */}
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title"><Camera className="w-5 h-5 text-indigo-650" /> Traffic CCTV Intelligence</h3>
                  <span className="card-subtitle">Vanguard Computer Vision analytics feed</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80" alt="Piccadilly Traffic" className="w-full h-40 object-cover" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-900">
                      <div className="font-bold text-xs">CCTV_01: Piccadilly Circus</div>
                      <div className="text-[10px] text-emerald-500 font-bold mt-1">STATUS: NORMAL FLOW</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" alt="London Bridge Traffic" className="w-full h-40 object-cover" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-900">
                      <div className="font-bold text-xs">CCTV_02: London Bridge North</div>
                      <div className="text-[10px] text-emerald-500 font-bold mt-1">STATUS: NORMAL FLOW</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=400&q=80" alt="Tower Bridge Traffic" className="w-full h-40 object-cover" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-900">
                      <div className="font-bold text-xs">CCTV_03: Tower Bridge Approach</div>
                      <div className="text-[10px] text-rose-500 font-bold mt-1 animate-pulse">STATUS: CONGESTED (84%)</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WEATHER & FORECAST */}
          {activeTab === 'weather' && (
            <div className="flex flex-col gap-6">
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title">Live Weather Forecast</h3>
                </div>
                {liveWeather ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div className="flex flex-col items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <span className="text-xs text-slate-400 font-bold uppercase">Today</span>
                      <div className="text-3xl font-bold font-mono mt-2">{liveWeather.current.temperature_2m}°C</div>
                      <span className="text-xs text-slate-500 mt-1">Precipitation: {liveWeather.current.precipitation} mm</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <span className="text-xs text-slate-400 font-bold uppercase">Wind Details</span>
                      <div className="text-3xl font-bold font-mono mt-2">{liveWeather.current.wind_speed_10m} km/h</div>
                      <span className="text-xs text-slate-500 mt-1">Angle: {liveWeather.current.wind_direction_10m}°</span>
                    </div>
                    <div className="flex flex-col items-center p-4 border border-slate-100 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
                      <span className="text-xs text-slate-400 font-bold uppercase">Humidity Level</span>
                      <div className="text-3xl font-bold font-mono mt-2">{liveWeather.current.relative_humidity_2m}%</div>
                      <span className="text-xs text-slate-500 mt-1">Apparent: {liveWeather.current.apparent_temperature}°C</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading forecast...</div>
                )}
              </div>

              {/* Weekly air quality forecast chart */}
              <div className="card">
                <div className="card-header pb-2 border-b border-slate-100 dark:border-slate-800">
                  <h4 className="card-title"><Wind className="w-5 h-5 text-indigo-650" /> Weekly Air Quality Predictions</h4>
                </div>
                <div className="h-[300px] mt-4">
                  <ReactECharts option={getForecastChart()} style={{ height: '100%', width: '100%' }} />
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: NEWS & MEDIA */}
          {activeTab === 'news' && (
            <div className="flex flex-col gap-6">
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  <h3 className="card-title"><FileText className="w-5 h-5 text-indigo-650" /> BBC London RSS News Channel</h3>
                  <span className="card-subtitle">Real-time local feed fetched directly from BBC News RSS</span>
                </div>
                
                {liveNews && liveNews.length > 0 ? (
                  <div className="news-grid">
                    {liveNews.slice(0, 8).map((art, idx) => (
                      <div key={idx} className="news-card">
                        <div className="news-card-img">
                          <img src={`https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=400&q=80`} alt="News" />
                        </div>
                        <div className="news-card-body">
                          <a href={art.link} target="_blank" rel="noopener noreferrer" className="news-card-title hover:text-indigo-650 transition-colors">
                            {art.title}
                          </a>
                          <p className="news-card-desc line-clamp-3">{art.description}</p>
                          <div className="news-card-footer">{art.pubDate}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading BBC News articles...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ACTUATORS & ANALYTICS */}
          {activeTab === 'others' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Submit civic complaint */}
                <div className="card lg:col-span-2">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title"><FileText className="w-5 h-5 text-indigo-650" /> Submit Civic Complaint</h3>
                    <span className="card-subtitle">Report infrastructure failures directly to regional maintenance engines.</span>
                  </div>

                  <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500">Category</label>
                        <select 
                          value={complaintForm.category}
                          onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))}
                          className="form-input"
                        >
                          <option value="Roads & Bridges">🛣️ Pavement & Structural Damage</option>
                          <option value="Utilities & Lighting">💡 Utilities & Electrical Grid</option>
                          <option value="Public Safety">🛡️ Public Safety & Security</option>
                          <option value="Environmental">🌿 Environmental & Green Spaces</option>
                          <option value="Transport">🚌 Transport & Traffic</option>
                          <option value="Social Services">🤝 Social Services & Housing</option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-semibold text-slate-500">Urgency</label>
                        <select 
                          value={complaintForm.priority}
                          onChange={(e) => setComplaintForm(prev => ({ ...prev, priority: e.target.value }))}
                          className="form-input"
                        >
                          <option value="Low">🟢 Low</option>
                          <option value="Medium">🔵 Medium</option>
                          <option value="High">🟠 High</option>
                          <option value="Critical">🔴 Critical</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">Title</label>
                      <input 
                        type="text" 
                        placeholder="Broken water pipe leaking..." 
                        value={complaintForm.title}
                        onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                        className="form-input"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-semibold text-slate-500">Description</label>
                      <textarea 
                        rows="3" 
                        placeholder="Provide details..."
                        value={complaintForm.description}
                        onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                        className="form-input"
                        style={{ resize: 'none' }}
                      />
                    </div>

                    <button type="submit" className="btn-3d btn-primary mt-2 w-full">Submit Ticket</button>
                  </form>
                </div>

                {/* Incident commands - dynamic from urgent tickets */}
                <div className="card">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title">⚡ Incident Console</h3>
                    <span className="card-subtitle">High-priority civic alerts requiring action</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {filteredTickets.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 3).length > 0 ? (
                      filteredTickets.filter(t => t.priority === 'Critical' || t.priority === 'High').slice(0, 3).map(t => (
                        <div key={t.id} className={`p-3 rounded-xl border ${t.priority === 'Critical' ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40' : 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/40'}`}>
                          <span className={`text-xs font-bold block mb-1 ${t.priority === 'Critical' ? 'text-rose-800 dark:text-rose-400' : 'text-amber-800 dark:text-amber-400'}`}>
                            {t.priority === 'Critical' ? '🚨' : '⚠️'} {t.id} — {t.title.slice(0, 38)}{t.title.length > 38 ? '...' : ''}
                          </span>
                          <p className="text-[10px] text-slate-500 mb-2">{t.department} · Status: {t.status}</p>
                          <button
                            onClick={() => executeCopilotAction(`Dispatch emergency response to: ${t.title}`)}
                            className="btn btn-primary py-1 text-xs w-full"
                            style={{ backgroundColor: t.priority === 'Critical' ? '#e11d48' : '#d97706' }}
                          >
                            🚀 Dispatch Response Unit
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-6 text-slate-400">
                        <div className="text-2xl mb-2">✅</div>
                        <p className="text-xs font-semibold">All clear — no critical incidents</p>
                        <p className="text-[10px] text-slate-400 mt-1">High-priority tickets will appear here automatically</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
              
              {/* Emergency Dispatch Control Center */}
              <section>
                <DispatchControl actions={actionHistory} onResolve={loadLiveData} />
              </section>

              {/* What-if simulator & Senate Chamber Grid */}
              <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <WhatIfSimulator onForecastRun={(params) => setSenatePolicy(params)} />
                <SenateChamber policyParams={senatePolicy} />
              </section>

              {/* Multi-agent status */}
              <section>
                <MultiAgentStatus logsList={systemLogs} />
              </section>

              {/* Active tickets workflow tracker */}
              <section>
                <WorkflowTracker 
                  ticketsList={filteredTickets} 
                  onSelectTicket={(t) => setSystemLogs(prev => [`Tracing complaint LND ID ${t.id}`, ...prev])}
                />
              </section>
            </div>
          )}

          {/* TAB 7: CITIZEN SENTIMENT & SOCIAL PULSE */}
          {activeTab === 'pulse' && (
            <div className="flex flex-col gap-0">
              <SentimentPulse />
            </div>
          )}

        </div>

        {/* Footer log monitor console */}
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-250 dark:border-slate-800 p-3 text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>Active Session ID: SM-DI-9428-26</span>
          <span className="truncate max-w-md">Latest Action: {systemLogs[0]}</span>
        </footer>
      </main>

      {/* Copilot overlay */}
      <AICopilot 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)}
        onActionTriggered={executeCopilotAction}
      />
    </div>
  );
}
