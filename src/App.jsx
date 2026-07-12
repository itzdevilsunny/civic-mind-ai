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
  Radio,
  Volume2,
  FileDown,
  HeartPulse,
  IndianRupee,
  Lightbulb,
  Bell,
  Network,
  Wrench
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
import CityBudget from './components/CityBudget';
import NotificationCenter from './components/NotificationCenter';
import PredictiveMaintenance from './components/PredictiveMaintenance';
import AgentTimeline from './components/AgentTimeline';
import LanguageSwitcher from './components/LanguageSwitcher';
import { CITIES_BY_STATE, getCityByValue } from './config/indianCities';
import { t } from './config/i18n';

const initialTickets = [
  {
    id: 'CMI-0101',
    title: 'Pothole on SV Road near Bandra station',
    category: 'Roads & Bridges',
    priority: 'Medium',
    status: 'In Progress',
    department: 'Roads & Bridges Dept.',
    officer: 'Rajesh Sharma',
    submittedAt: 'Jul 06, 2026, 09:30 AM',
    stage: 3
  },
  {
    id: 'CMI-0102',
    title: 'Water main leakage near Juhu Beach road',
    category: 'Utilities & Lighting',
    priority: 'High',
    status: 'Resolved',
    department: 'Power & Water Dept.',
    officer: 'Priya Nair',
    submittedAt: 'Jul 05, 2026, 02:15 PM',
    stage: 4
  },
  {
    id: 'CMI-0103',
    title: 'Flickering streetlights near Borivali Senior Care Centre',
    category: 'Utilities & Lighting',
    priority: 'Critical',
    status: 'Assigned',
    department: 'Power & Water Dept.',
    officer: 'Arjun Menon',
    submittedAt: 'Jul 06, 2026, 06:45 PM',
    stage: 2
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  
  // City & Language state
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('civicmind_city') || 'mumbai');
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('civicmind_lang') || 'en');
  const cityInfo = getCityByValue(selectedCity);

  const [copilotBtnPos, setCopilotBtnPos] = useState({ x: 800, y: 500 });
  const posRef = useRef({ x: 800, y: 500 });
  posRef.current = copilotBtnPos;
  
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 800, initialY: 500 });

  useEffect(() => {
    const xVal = window.innerWidth - 80;
    const yVal = window.innerHeight - 150;
    setCopilotBtnPos({ x: xVal, y: yVal });
    posRef.current = { x: xVal, y: yVal };
  }, []);

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      initialX: posRef.current.x,
      initialY: posRef.current.y
    };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    const newX = Math.max(10, Math.min(window.innerWidth - 60, dragRef.current.initialX + dx));
    const newY = Math.max(10, Math.min(window.innerHeight - 60, dragRef.current.initialY + dy));
    setCopilotBtnPos({ x: newX, y: newY });
  };

  const handleMouseUp = (e) => {
    if (!dragRef.current.isDragging) return;
    dragRef.current.isDragging = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    const dx = Math.abs(e.clientX - dragRef.current.startX);
    const dy = Math.abs(e.clientY - dragRef.current.startY);
    if (dx < 5 && dy < 5) {
      setIsCopilotOpen(prev => !prev);
    }
  };
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
  const [bikeSearchQuery, setBikeSearchQuery] = useState('');
  const [aqiForecast, setAqiForecast] = useState(null);
  const [sustainability, setSustainability] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [bikepoints, setBikepoints] = useState({
    success: false,
    global: { total_bikes: 4195, total_empty: 1055, total_docks: 5250, active_stations: 795, occupancy_pct: 80 },
    stations: []
  });
  
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
    link.download = `${cityInfo.label.replace(/ /g,'_').toLowerCase()}_civic_audit_report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  useEffect(() => {
    const synth = synthRef.current;
    return () => {
      if (synth) {
        synth.cancel();
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

  const [proposalForm, setProposalForm] = useState({
    title: '',
    category: 'Environmental',
    district: 'Westminster',
    description: ''
  });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  const [systemLogs, setSystemLogs] = useState([
    "Traffic Agent: Westminster Grid monitoring initialized.",
    "Transit Agent: TfL line statuses synced.",
    "Safety Agent: OpenStreetMap interactive node layers ready."
  ]);

  // Load all live APIs from proxy endpoints — passes city lat/lng/tz so backend fetches real city data
  const loadLiveData = () => {
    const { lat, lng, tz } = cityInfo;
    const geoQ = `lat=${lat}&lng=${lng}&tz=${encodeURIComponent(tz)}`;
    const geoQ2 = `lat=${lat}&lng=${lng}`;
    Promise.all([
      fetch(`/api/live/weather?${geoQ}`).then(res => res.json()).catch(() => null),
      fetch(`/api/live/aqi?${geoQ2}`).then(res => res.json()).catch(() => null),
      fetch('/api/live/transport').then(res => res.json()).catch(() => []),
      fetch('/api/live/market').then(res => res.json()).catch(() => null),
      fetch('/api/live/news').then(res => res.json()).catch(() => []),
      fetch('/api/tickets').then(res => res.json()).catch(() => null),
      fetch('/api/telemetry').then(res => res.json()).catch(() => []),
      fetch('/api/actions').then(res => res.json()).catch(() => []),
      fetch(`/api/live/aqi/forecast?${geoQ2}`).then(res => res.json()).catch(() => null),
      fetch('/api/live/bikepoints').then(res => res.json()).catch(() => null),
      fetch('/api/sustainability/metrics').then(res => res.json()).catch(() => null),
      fetch('/api/proposals').then(res => res.json()).catch(() => [])
    ]).then(([weather, aqi, transport, market, news, dbTickets, telemetryData, actionsData, aqiForecastData, bikepointsData, sustainabilityData, proposalsData]) => {
      if (weather) setLiveWeather(weather);
      if (aqi) setLiveAqi(aqi);
      if (transport && transport.length > 0) setLiveTransport(transport);
      if (market) setLiveMarket(market);
      if (news && news.length > 0) setLiveNews(news);
      if (telemetryData && telemetryData.length > 0) setTelemetry(telemetryData);
      if (actionsData) setActionHistory(actionsData);
      if (aqiForecastData) setAqiForecast(aqiForecastData);
      if (bikepointsData) setBikepoints(bikepointsData);
      if (sustainabilityData) setSustainability(sustainabilityData);
      if (proposalsData) setProposals(proposalsData);
      if (dbTickets) {
        setTickets(dbTickets);
        setIsBackendOnline(true);
      } else {
        setIsBackendOnline(false);
      }
    });
  };

  const handleProposalSubmit = (e) => {
    e.preventDefault();
    if (!proposalForm.title || !proposalForm.description) return;
    
    setIsSubmittingProposal(true);
    setSystemLogs(prev => [`Citizen Agent: Submitting community proposal: "${proposalForm.title}"...`, ...prev]);
    
    fetch('/api/proposals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(proposalForm)
    })
      .then(res => res.json())
      .then(newProp => {
        setIsSubmittingProposal(false);
        setProposals(prev => [newProp, ...prev]);
        setProposalForm({ title: '', category: 'Environmental', district: 'Westminster', description: '' });
        setSystemLogs(prev => [`Senate Chamber: Proposal ${newProp.id} evaluated. Senate Verdict: ${newProp.senate_result}.`, ...prev]);
        confetti({ particleCount: 80, spread: 60 });
      })
      .catch(err => {
        console.error("Failed to submit proposal:", err);
        setIsSubmittingProposal(false);
        setSystemLogs(prev => [`System Error: Failed to register proposal.`, ...prev]);
      });
  };

  const handleProposalUpvote = (id) => {
    // Optimistic upvote increment
    setProposals(prev => prev.map(p => p.id === id ? { ...p, upvotes: p.upvotes + 1 } : p));
    setSystemLogs(prev => [`Citizen Agent: Registering support vote for proposal ${id}`, ...prev]);
    
    fetch(`/api/proposals/${id}/upvote`, {
      method: 'POST'
    })
      .then(res => res.json())
      .catch(err => {
        console.error("Failed to upvote proposal:", err);
      });
  };

  useEffect(() => {
    loadLiveData();
    const interval = setInterval(loadLiveData, 30000);
    return () => clearInterval(interval);
  // Re-run when city changes so real data is fetched for new coordinates
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  // Persist city preference
  useEffect(() => {
    localStorage.setItem('civicmind_city', selectedCity);
  }, [selectedCity]);

  // Handle dark mode toggle
  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Generate alerts from live telemetry
  useEffect(() => {
    const generateAlerts = () => {
      const newAlerts = [];
      const now = Date.now();
      if (liveAqi?.pm2_5 > 30) {
        newAlerts.push({ id: `aqi-${now}`, type: 'environment', title: 'Air Quality Alert', body: `PM2.5 elevated at ${liveAqi.pm2_5} µg/m³ — advising sensitive groups indoors.`, ts: now, read: false });
      }
      if (tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length > 0) {
        newAlerts.push({ id: `ticket-${now}`, type: 'safety', title: 'Critical Ticket Open', body: `${tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length} critical civic complaints awaiting resolution.`, ts: now - 45000, read: false });
      }
      if (liveWeather?.condition?.includes('Rain')) {
        newAlerts.push({ id: `weather-${now}`, type: 'operations', title: 'Precipitation Advisory', body: `Rain detected — reviewing drainage capacity and road surface friction indices.`, ts: now - 120000, read: false });
      }
      newAlerts.push({ id: `ops-${now}`, type: 'operations', title: 'System Sync Complete', body: 'All IoT sensors reporting nominal. Last telemetry sync: successful.', ts: now - 300000, read: true });
      setAlerts(newAlerts);
    };
    generateAlerts();
  }, [liveAqi, tickets, liveWeather]);

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
          'Roads & Bridges': t('deptRoads', selectedLang),
          'Utilities & Lighting': t('deptUtilities', selectedLang),
          'Public Safety': t('deptPolice', selectedLang),
          'Environmental': t('deptEnv', selectedLang),
          'Transport': t('deptTransport', selectedLang),
          'Social Services': t('deptSocial', selectedLang),
        };
        const fallbackTicket = {
          id: `CMI-${Math.random().toString(16).slice(2,6).toUpperCase()}`,
          title: complaintForm.title,
          category: complaintForm.category,
          priority: complaintForm.priority,
          status: 'Submission Received',
          department: deptMap[complaintForm.category] || `${cityInfo.label} Civic Authority`,
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

  const getWeatherChartOption = () => {
    const days = liveWeather?.daily?.time || ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const maxTemp = liveWeather?.daily?.temperature_2m_max || [22, 23, 21, 19, 22, 24, 25];
    const minTemp = liveWeather?.daily?.temperature_2m_min || [12, 13, 11, 10, 12, 14, 15];

    return {
      tooltip: { trigger: 'axis', formatter: '{b}<br/>Max: {c0}°C<br/>Min: {c1}°C' },
      legend: { data: ['Max Temperature', 'Min Temperature'], bottom: 0 },
      grid: { left: '3%', right: '3%', top: '10%', bottom: '15%', containLabel: true },
      xAxis: { type: 'category', data: days, axisLine: { lineStyle: { color: '#cbd5e1' } } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}°C' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: 'Max Temperature', type: 'line', data: maxTemp, smooth: true, itemStyle: { color: '#ef4444' }, lineStyle: { width: 3 } },
        { name: 'Min Temperature', type: 'line', data: minTemp, smooth: true, itemStyle: { color: '#3b82f6' }, lineStyle: { width: 3 } }
      ]
    };
  };

  const getSustainabilityChartOption = () => {
    if (!sustainability || !sustainability.district_ranks) return {};
    const districts = sustainability.district_ranks.map(d => d.district).reverse();
    const scores = sustainability.district_ranks.map(d => d.score).reverse();

    return {
      tooltip: { trigger: 'axis', formatter: '{b}: {c}/100' },
      grid: { left: '3%', right: '8%', top: '5%', bottom: '5%', containLabel: true },
      xAxis: { type: 'value', max: 100, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      yAxis: { type: 'category', data: districts, axisLine: { show: false }, axisTick: { show: false } },
      series: [{
        type: 'bar',
        data: scores.map(val => ({
          value: val,
          itemStyle: {
            color: val >= 85 ? '#10b981' : val >= 70 ? '#f59e0b' : '#ef4444',
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barMaxWidth: 18,
        label: { show: true, position: 'right', formatter: '{c}' }
      }]
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

  const getCityRadarOption = () => {
    const tubeDelayCount = liveTransport ? liveTransport.filter(line => {
      const desc = line.lineStatuses?.[0]?.statusSeverityDescription;
      return desc && desc !== 'Good Service' && desc !== 'Special Service';
    }).length : 0;
    
    const mobilityScore = Math.max(35, Math.min(98, Math.round(88 - (tubeDelayCount * 6) + ((bikepoints.global?.occupancy_pct || 40) - 40) * 0.1)));

    const pm25 = liveAqi?.current?.pm2_5 || 12;
    const solarVal = sustainability?.solar_output_mw || 15.0;
    const environmentScore = Math.max(35, Math.min(98, Math.round(92 - (pm25 * 0.8) + (solarVal * 0.2))));

    const financialsScore = sustainability ? Math.max(45, Math.min(98, Math.round(95 - (sustainability.emissions_kg_hr * 0.002)))) : 82;

    const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
    const safetyScore = Math.max(35, Math.min(98, Math.round(90 - (criticalTickets * 8))));

    const sentimentScore = Math.max(35, Math.min(98, Math.round(78 - (criticalTickets * 5))));

    const data = [mobilityScore, environmentScore, financialsScore, safetyScore, sentimentScore];

    return {
      tooltip: { trigger: 'item' },
      radar: {
        indicator: [
          { name: 'Mobility', max: 100 },
          { name: 'Environment', max: 100 },
          { name: 'Financials', max: 100 },
          { name: 'Safety', max: 100 },
          { name: 'Sentiment', max: 100 }
        ],
        shape: 'polygon',
        splitNumber: 4,
        axisName: {
          color: '#64748b',
          fontSize: 9,
          fontWeight: 'bold'
        },
        splitLine: {
          lineStyle: {
            color: [
              'rgba(99, 102, 241, 0.05)',
              'rgba(99, 102, 241, 0.1)',
              'rgba(99, 102, 241, 0.2)',
              'rgba(99, 102, 241, 0.35)'
            ]
          }
        },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: 'rgba(99, 102, 241, 0.1)' } }
      },
      series: [
        {
          name: `${cityInfo?.label || 'City'} Civic Health`,
          type: 'radar',
          data: [
            {
              value: data,
              name: 'Civic Performance Score',
              symbol: 'circle',
              symbolSize: 4,
              itemStyle: { color: '#6366f1' },
              lineStyle: { width: 2, color: '#6366f1' },
              areaStyle: {
                color: {
                  type: 'radial',
                  x: 0.5,
                  y: 0.5,
                  r: 0.5,
                  colorStops: [
                    { offset: 0, color: 'rgba(99, 102, 241, 0.05)' },
                    { offset: 1, color: 'rgba(99, 102, 241, 0.3)' }
                  ]
                }
              }
            }
          ]
        }
      ]
    };
  };

  const getAIDiagnosisSummary = () => {
    let alerts = [];
    const tubeDelayCount = liveTransport ? liveTransport.filter(line => {
      const desc = line.lineStatuses?.[0]?.statusSeverityDescription;
      return desc && desc !== 'Good Service' && desc !== 'Special Service';
    }).length : 0;
    if (tubeDelayCount > 0) alerts.push(`${tubeDelayCount} Tube line delays`);
    
    const rain = liveWeather?.current?.precipitation || 0.0;
    if (rain > 0.5) alerts.push(`wet road conditions (${rain}mm)`);
    
    const pm25 = liveAqi?.current?.pm2_5 || 12;
    if (pm25 > 15) alerts.push(`elevated PM2.5 AQI`);

    const criticalTickets = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
    if (criticalTickets > 0) alerts.push(`${criticalTickets} critical incidents`);

    if (alerts.length === 0) {
      return `All ${cityInfo?.label || 'City'} municipal systems operating optimally. Low environmental risk levels, balanced departmental budgets, and smooth transport line flows detected.`;
    }
    return `Civic Intelligence sensors report: ${alerts.join(', ')}. Multi-agent coordination protocols are currently active to resolve bottlenecks and optimize municipal scores.`;
  };

  const filteredTickets = tickets.filter(t => 
    t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeTrains = liveTransport && liveTransport.length > 0
    ? Math.round(508 * (liveTransport.filter(line => {
        const status = line.lineStatuses[0]?.statusSeverityDescription || 'Good Service';
        return status === 'Good Service' || status.includes('Minor');
      }).length / liveTransport.length))
    : 508;

  const activeBuses = 8522 - (liveWeather?.current?.precipitation ? Math.round(liveWeather.current.precipitation * 80) : 0);

  const filteredBikepoints = (bikepoints.stations || []).filter(bp => 
    bp.name.toLowerCase().includes(bikeSearchQuery.toLowerCase())
  );

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo flex items-center gap-2">
          <span>🏙️ CivicMind AI</span>
        </div>

        {/* User profile details matching spec */}
        <div className="flex flex-col items-center gap-1.5 py-2 border-b border-slate-150/10 mb-2">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200 dark:border-slate-800">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80" alt="Al-Amin Lousa" />
          </div>
          <div className="text-center">
            <div className="font-bold text-[11px] text-slate-800 dark:text-slate-200">Al-Amin Lousa</div>
            <div className="text-[9px] text-slate-450">City Administrator</div>
          </div>
        </div>
        
        <ul className="sidebar-menu mt-4">
          <li className={`menu-item ${activeTab === 'overview' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('overview')}>
              <Building2 className="w-4 h-4" /> {t('overview', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'transportations' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('transportations')}>
              <Car className="w-4 h-4" /> {t('transportations', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'traffic' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('traffic')}>
              <Camera className="w-4 h-4" /> {t('traffic', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'weather' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('weather')}>
              <CloudSun className="w-4 h-4" /> {t('weather', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'news' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('news')}>
              <FileText className="w-4 h-4" /> {t('news', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'others' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('others')}>
              <Users className="w-4 h-4" /> {t('others', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'pulse' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('pulse')}>
              <HeartPulse className="w-4 h-4" /> {t('pulse', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'budget' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('budget')}>
              <IndianRupee className="w-4 h-4" /> {t('budget', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'proposals' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('proposals')}>
              <Lightbulb className="w-4 h-4" /> {t('proposals', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'maintenance' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('maintenance')}>
              <Wrench className="w-4 h-4" /> {t('maintenance', selectedLang)}
            </button>
          </li>
          <li className={`menu-item ${activeTab === 'agentlog' ? 'active' : ''}`}>
            <button onClick={() => setActiveTab('agentlog')}>
              <Network className="w-4 h-4" /> {t('agentlog', selectedLang)}
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
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{t('changeCity', selectedLang)}:</span>
              <select
                className="form-input py-1 text-xs font-semibold"
                style={{ width: 'auto', maxWidth: '200px' }}
                value={selectedCity}
                onChange={e => setSelectedCity(e.target.value)}
              >
                {Object.entries(CITIES_BY_STATE).sort(([a],[b]) => a.localeCompare(b)).map(([state, cities]) => (
                  <optgroup key={state} label={state}>
                    {cities.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="relative">
              <input 
                type="text" 
                placeholder={t('search', selectedLang)}
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
                onClick={() => setIsNotifOpen(true)}
                style={{ position: 'relative', cursor: 'pointer', background: 'none', border: 'none', padding: '4px', display: 'flex', alignItems: 'center' }}
                title="Alert Center"
              >
                <Bell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                {alerts.filter(a => !a.read).length > 0 && (
                  <span style={{
                    position: 'absolute', top: '-2px', right: '-2px',
                    width: '16px', height: '16px', borderRadius: '50%',
                    background: 'linear-gradient(135deg,#f43f5e,#e11d48)',
                    fontSize: '8px', fontWeight: 900, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 8px rgba(244,63,94,0.6)',
                    animation: 'pulse 2s infinite',
                  }}>{alerts.filter(a => !a.read).length}</span>
                )}
              </button>
              <LanguageSwitcher
                selectedLang={selectedLang}
                onLangChange={setSelectedLang}
                isDarkMode={isDarkMode}
              />

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
                <span>{isSpeaking ? "Stop Briefing" : t('voiceBriefing', selectedLang)}</span>
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
              
              {/* Civic Health Radar & AI Diagnosis Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Radar Chart (2/3 width) */}
                <div className="card lg:col-span-2">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title">🕸️ Civic Health Radar index</h3>
                    <span className="card-subtitle">Real-time multi-dimensional city metrics overview</span>
                  </div>
                  <div className="h-[220px]">
                    <ReactECharts option={getCityRadarOption()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                {/* AI Operational Diagnosis card (1/3 width) */}
                <div className="card flex flex-col justify-between">
                  <div>
                    <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <h3 className="card-title">🤖 AI Operational Diagnosis</h3>
                      <span className="card-subtitle">Gemini real-time civic health report</span>
                    </div>
                    <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-medium mt-2">
                      {getAIDiagnosisSummary()}
                    </p>
                  </div>
                  <div className="mt-4 p-3 bg-indigo-50/10 border border-indigo-150/10 rounded-xl flex justify-between items-center text-[10px] font-mono text-indigo-650">
                    <span>COORDINATOR: ACTIVE</span>
                    <span>DIAGNOSIS CONFIDENCE: 94%</span>
                  </div>
                </div>
              </div>

              {/* Weather Station Summary Card */}
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title"><CloudSun className="w-5 h-5 text-sky-500" /> Weather Station ({cityInfo?.label || 'City'} Central)</h3>
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
                    activeTickets={tickets}
                    bikepointsList={bikepoints.stations || []}
                    onEmergencyDispatch={loadLiveData}
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
                    <h3 className="card-title"><Car className="w-5 h-5 text-indigo-600" /> {cityInfo?.label || 'City'} Transit Network</h3>
                    <span className="card-subtitle">Real-time status updates from {cityInfo?.label || 'City'} Transit Authority</span>
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
                    <span className="card-subtitle">Live {cityInfo?.label || 'City'} Local News</span>
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
                    <h4 className="font-bold text-sm text-indigo-800 dark:text-indigo-400">Buses in Service</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-indigo-700 dark:text-indigo-400 mt-2">
                    {activeBuses.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-4">{cityInfo?.label || 'City'} Bus Network (Live Traffic Adjusted)</div>
                </div>
                <div className="card bg-sky-50/50 dark:bg-sky-950/20 border-sky-150">
                  <div className="card-header pb-2">
                    <h4 className="font-bold text-sm text-sky-800 dark:text-sky-400">Trains in Service</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-sky-700 dark:text-sky-400 mt-2">
                    {activeTrains.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-4">TfL Tube Lines (Live Status Weighted)</div>
                </div>
                <div className="card bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-150">
                  <div className="card-header pb-2">
                    <h4 className="font-bold text-sm text-emerald-800 dark:text-emerald-400">Active Bicycles</h4>
                  </div>
                  <div className="text-3xl font-bold font-mono text-emerald-700 dark:text-emerald-400 mt-2">
                    {bikepoints.global.total_bikes.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-450 mt-4">
                    Santander Cycles: {bikepoints.global.occupancy_pct}% Docks Occupied
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Tube Status Board */}
                <div className="card">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title">Tube Status Board</h3>
                    <span className="card-subtitle">Live TfL Underground Network Statuses</span>
                  </div>
                  {liveTransport && liveTransport.length > 0 ? (
                    <div className="flex flex-col gap-2 max-h-[350px] overflow-y-auto pr-1">
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

                {/* Santander Cycles Docks Live Feed */}
                <div className="card">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center flex-wrap gap-2">
                    <div>
                      <h3 className="card-title">🚲 Santander Cycles Docks</h3>
                      <span className="card-subtitle">Real-time dock and bike availability</span>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Filter docks..."
                      value={bikeSearchQuery}
                      onChange={(e) => setBikeSearchQuery(e.target.value)}
                      className="form-input text-xs py-1 px-2 max-w-[150px]"
                    />
                  </div>

                  <div className="flex flex-col gap-2.5 max-h-[350px] overflow-y-auto pr-1">
                    {filteredBikepoints.length > 0 ? (
                      filteredBikepoints.map(bp => (
                        <div key={bp.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-sky-300 dark:hover:border-sky-900/40 transition-colors">
                          <div className="flex-1 min-w-0">
                            <span className="font-bold text-xs text-slate-880 dark:text-slate-200 block truncate">{bp.name}</span>
                            <span className="text-[10px] text-slate-400">Station ID: {bp.id}</span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <span className="text-xs font-black text-sky-600 block">🚲 {bp.bikes} bikes</span>
                              <span className="text-[10px] text-slate-450">🔓 {bp.empty} spaces</span>
                            </div>
                            <div className="relative w-8 h-8 flex-shrink-0 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-850">
                              <span className="text-[9px] font-bold text-sky-600">{bp.occupancy_pct}%</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-slate-450">
                        <span className="text-2xl block mb-1">🔍</span>
                        <p className="text-xs">No matching Santander Cycle docks found.</p>
                      </div>
                    )}
                  </div>
                </div>
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
                  bikepointsList={bikepoints.stations || []}
                  onEmergencyDispatch={loadLiveData}
                  cityInfo={cityInfo}
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
                    <img src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" alt="City Bridge Traffic" className="w-full h-40 object-cover" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-900">
                      <div className="font-bold text-xs">CCTV_02: {cityInfo?.districts?.[2] || 'Main'} Crossing</div>
                      <div className="text-[10px] text-emerald-500 font-bold mt-1">STATUS: NORMAL FLOW</div>
                    </div>
                  </div>
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                    <img src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=400&q=80" alt="City Traffic" className="w-full h-40 object-cover" />
                    <div className="p-3 bg-slate-50 dark:bg-slate-900">
                      <div className="font-bold text-xs">CCTV_03: {cityInfo?.districts?.[3] || 'Secondary'} Flyover</div>
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
              
              {/* Live Weather Forecast Summary */}
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                  <h3 className="card-title">Live Weather &amp; Meteorological Forecast</h3>
                  <span className="card-subtitle">Real-time reports for {cityInfo?.label || 'City'} Central</span>
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
                      <div className="text-[10px] text-slate-500 font-semibold mb-1">Air Quality Index</div>
                      <div className="text-xl font-bold font-mono text-rose-500">{liveAqi?.current?.pm2_5 || 12} µg/m³</div>
                      <div className="text-[9px] text-slate-450">NO₂: {liveAqi?.current?.nitrogen_dioxide || 22} µg/m³</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading forecast...</div>
                )}
              </div>

              {/* Charts Row: Temp Curves + Air Quality */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card">
                  <div className="card-header pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="card-title">📈 7-Day Temperature Forecast</h4>
                    <span className="card-subtitle">Daily maximum &amp; minimum temperature paths</span>
                  </div>
                  <div className="h-[280px] mt-4">
                    <ReactECharts option={getWeatherChartOption()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>

                <div className="card">
                  <div className="card-header pb-2 border-b border-slate-100 dark:border-slate-800">
                    <h4 className="card-title">🍃 Weekly Air Quality Predictions</h4>
                    <span className="card-subtitle">Predicted particulate concentrations</span>
                  </div>
                  <div className="h-[280px] mt-4">
                    <ReactECharts option={getForecastChart()} style={{ height: '100%', width: '100%' }} />
                  </div>
                </div>
              </div>

              {/* Sustainability Headline Banner */}
              {sustainability && (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="card p-4 border-l-4 border-emerald-500 bg-emerald-50/10">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Solar Generation</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">{sustainability.solar_output_mw} MW</p>
                      <p className="text-[10px] text-slate-500 mt-1">Array efficiency: {sustainability.solar_efficiency}%</p>
                    </div>
                    <div className="card p-4 border-l-4 border-sky-500 bg-sky-50/10">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Renewable Grid Mix</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">{sustainability.renewable_mix_pct}%</p>
                      <p className="text-[10px] text-slate-500 mt-1">Solar / wind weighted</p>
                    </div>
                    <div className="card p-4 border-l-4 border-teal-500 bg-teal-50/10">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Carbon Saved</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">{sustainability.carbon_saved_t_hr} T/hr</p>
                      <p className="text-[10px] text-slate-500 mt-1">Solar offset equivalent</p>
                    </div>
                    <div className="card p-4 border-l-4 border-rose-500 bg-rose-50/10">
                      <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">CO2 Emissions Index</p>
                      <p className="text-xl font-black text-slate-800 dark:text-slate-200 mt-0.5">{(sustainability.emissions_kg_hr / 1000).toFixed(2)} T/hr</p>
                      <p className="text-[10px] text-slate-500 mt-1">Base + Traffic load computed</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* District Sustainability Health Chart */}
                    <div className="card lg:col-span-2">
                      <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                        <h3 className="card-title">🏢 {cityInfo?.label || 'City'} District Green Rating</h3>
                        <span className="card-subtitle">Environmental indices scored from live ticket loads &amp; AQI levels</span>
                      </div>
                      <div className="h-[250px]">
                        <ReactECharts option={getSustainabilityChartOption()} style={{ height: '100%', width: '100%' }} />
                      </div>
                    </div>

                    {/* AI Executive Summary Card */}
                    <div className="card flex flex-col justify-between">
                      <div>
                        <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                          <h3 className="card-title">🤖 AI Sustainability Diagnosis</h3>
                          <span className="card-subtitle">Gemini operational environmental health audit</span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-350 leading-relaxed font-medium mt-1">
                          {sustainability.ai_analysis?.sustainability_summary}
                        </p>
                      </div>
                      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-500">CLIMATE RISK PROFILE:</span>
                        <span className={`font-black px-2 py-0.5 rounded text-[10px] ${
                          sustainability.ai_analysis?.climate_risk_level === 'Low'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400'
                        }`}>
                          {sustainability.ai_analysis?.climate_risk_level || 'Calculating...'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI Recommendations panel */}
                  <div className="card">
                    <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <h3 className="card-title">💡 Climate &amp; Green Policy Suggestions</h3>
                      <span className="card-subtitle">AI recommendations to lower municipality carbon index</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(sustainability.ai_analysis?.recommendations || []).map((rec, i) => {
                        const prioColors = { High: 'text-red-500 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30', Medium: 'text-amber-500 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/30', Low: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/30' };
                        const cardStyles = prioColors[rec.priority] || '';
                        return (
                          <div key={i} className={'p-4 rounded-xl border flex flex-col gap-2 ' + cardStyles}>
                            <div className="flex justify-between items-start gap-2">
                              <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">{rec.title}</h4>
                              <span className="text-[9px] font-black px-1.5 py-0.5 rounded uppercase">{rec.priority} PRIO</span>
                            </div>
                            <p className="text-[10px] text-slate-500 leading-relaxed">{rec.description}</p>
                            <div className="mt-auto pt-2 border-t border-slate-200/30 flex justify-between text-[9px] text-slate-450">
                              <span>Impact: <strong>{rec.impact}</strong></span>
                              <span>Cost: <strong>{rec.cost}</strong></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 5: NEWS & MEDIA */}
          {activeTab === 'news' && (
            <div className="flex flex-col gap-6">
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-6">
                  <h3 className="card-title"><FileText className="w-5 h-5 text-indigo-650" /> {cityInfo?.label || 'City'} Local RSS News Channel</h3>
                  <span className="card-subtitle">Real-time local feed fetched directly from local RSS news source</span>
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
              <SentimentPulse isDarkMode={isDarkMode} cityInfo={cityInfo} />
            </div>
          )}

          {/* TAB 8: CITY BUDGET & FINANCIAL INTELLIGENCE */}
          {activeTab === 'budget' && (
            <div className="flex flex-col gap-0">
              <CityBudget />
            </div>
          )}

          {/* TAB 9: COMMUNITY PROPOSALS & FEASIBILITY CHAMBER */}
          {activeTab === 'proposals' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Left Column: Propose Community Idea Form */}
              <div className="card h-fit">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-5">
                  <h3 className="card-title">💡 Propose Community Idea</h3>
                  <span className="card-subtitle">Submit a project idea to the multi-agent planning engine</span>
                </div>
                
                <form onSubmit={handleProposalSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Proposal Title</label>
                    <input 
                      type="text"
                      className="input w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                      placeholder="e.g. Pedestrian Walkway on Southwark St"
                      value={proposalForm.title}
                      onChange={(e) => setProposalForm(prev => ({ ...prev, title: e.target.value }))}
                      disabled={isSubmittingProposal}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Category</label>
                      <select 
                        className="input w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                        value={proposalForm.category}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, category: e.target.value }))}
                        disabled={isSubmittingProposal}
                      >
                        <option value="Roads & Bridges">Roads &amp; Bridges</option>
                        <option value="Utilities & Lighting">Utilities &amp; Lighting</option>
                        <option value="Environmental">Environmental</option>
                        <option value="Transit & Trains">Transit &amp; Trains</option>
                        <option value="Social Services">Social Services</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">District</label>
                      <select 
                        className="input w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100"
                        value={proposalForm.district}
                        onChange={(e) => setProposalForm(prev => ({ ...prev, district: e.target.value }))}
                        disabled={isSubmittingProposal}
                      >
                        <option value="Westminster">Westminster</option>
                        <option value="Camden">Camden</option>
                        <option value="Lambeth">Lambeth</option>
                        <option value="Southwark">Southwark</option>
                        <option value="Islington">Islington</option>
                        <option value="Hackney">Hackney</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-1">Project Description</label>
                    <textarea 
                      className="input w-full text-xs p-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-800 dark:text-slate-100 h-28 resize-none"
                      placeholder="Describe your proposal in detail (safety benefits, location, community impact)..."
                      value={proposalForm.description}
                      onChange={(e) => setProposalForm(prev => ({ ...prev, description: e.target.value }))}
                      disabled={isSubmittingProposal}
                      required
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn-3d btn-primary w-full py-2.5 flex items-center justify-center gap-2 text-xs"
                    disabled={isSubmittingProposal}
                  >
                    {isSubmittingProposal ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        <span>AI Planner Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <span>Submit Proposal</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

              {/* Right Column: Live Proposals list & Metrics */}
              <div className="xl:col-span-2 flex flex-col gap-6">
                
                {/* Proposals Global Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block tracking-wider">Total Proposals</span>
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1 block">{proposals.length}</span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block tracking-wider">Average Feasibility</span>
                    <span className="text-2xl font-black text-emerald-500 mt-1 block">
                      {proposals.length > 0 ? Math.round(proposals.reduce((acc, curr) => acc + curr.feasibility, 0) / proposals.length) : 0}%
                    </span>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-4 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-450 uppercase block tracking-wider">Est. Budget Pool</span>
                    <span className="text-2xl font-black text-amber-500 mt-1 block">
                      £{(proposals.reduce((acc, curr) => acc + (curr.cost_estimate || 0), 0) / 1000).toFixed(0)}K
                    </span>
                  </div>
                </div>

                {/* Proposals Feed List */}
                <div className="card">
                  <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                    <h3 className="card-title">📣 Active Citizen Proposals</h3>
                    <span className="card-subtitle">Support and track crowdsourced suggestions from different districts</span>
                  </div>

                  <div className="flex flex-col gap-4 max-h-[550px] overflow-y-auto pr-1">
                    {proposals.length > 0 ? (
                      proposals.map(prop => {
                        const scoreBarColor = prop.feasibility >= 80 ? 'bg-emerald-500' : prop.feasibility >= 65 ? 'bg-amber-500' : 'bg-red-500';
                        
                        const verdictStyles = {
                          "Approved for Pilot": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/30",
                          "Passed with Amendment": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-400 border-sky-200 dark:border-sky-900/30",
                          "Deferred for Study": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-900/30",
                          "Rejected due to Cost": "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-400 border-rose-200 dark:border-rose-900/30",
                          "Pending Debate": "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-355 border-slate-200 dark:border-slate-750"
                        };
                        const verdictClass = verdictStyles[prop.senate_result] || verdictStyles["Pending Debate"];

                        return (
                          <div key={prop.id} className="p-4 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-300 dark:hover:border-indigo-900/40 transition-all flex flex-col gap-3">
                            
                            {/* Proposal Header */}
                            <div className="flex justify-between items-start gap-4">
                              <div>
                                <span className="text-[10px] font-bold text-indigo-500 font-mono block mb-0.5">{prop.id}</span>
                                <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 leading-snug">{prop.title}</h4>
                              </div>

                              <button 
                                onClick={() => handleProposalUpvote(prop.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-850 hover:bg-rose-50 dark:hover:bg-rose-950/20 hover:border-rose-300 dark:hover:border-rose-900/30 text-slate-500 hover:text-rose-500 transition-all cursor-pointer"
                              >
                                <span className="text-[11px] font-extrabold font-mono">❤️ {prop.upvotes}</span>
                              </button>
                            </div>

                            {/* Description text */}
                            <p className="text-[11px] text-slate-500 leading-relaxed dark:text-slate-400">{prop.description}</p>

                            {/* Tags Grid */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                              <div>
                                <span className="text-[9px] text-slate-400 block font-semibold">Location / Category</span>
                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block truncate">{prop.district} • {prop.category}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-semibold">Est. Capital Required</span>
                                <span className="text-[10px] font-black text-amber-600 block">£{prop.cost_estimate?.toLocaleString() || 'TBD'}</span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-semibold">Sentiment Index</span>
                                <span className={`text-[10px] font-bold block ${
                                  prop.sentiment === 'Favorable' ? 'text-emerald-500' : prop.sentiment === 'Unfavorable' ? 'text-rose-500' : 'text-amber-500'
                                }`}>
                                  {prop.sentiment}
                                </span>
                              </div>
                              <div>
                                <span className="text-[9px] text-slate-400 block font-semibold">Senate Chamber Decision</span>
                                <span className={`inline-block text-[9px] font-black px-1.5 py-0.5 rounded border mt-0.5 ${verdictClass}`}>
                                  {prop.senate_result}
                                </span>
                              </div>
                            </div>

                            {/* Feasibility progress bar indicator */}
                            <div className="pt-2 flex items-center justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex justify-between items-center text-[9px] mb-1">
                                  <span className="font-bold text-slate-400">FEASIBILITY CONFIDENCE</span>
                                  <span className="font-extrabold text-slate-650 dark:text-slate-350">{prop.feasibility}%</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div className={`h-full ${scoreBarColor} rounded-full`} style={{ width: `${prop.feasibility}%` }}></div>
                                </div>
                              </div>
                            </div>

                            {/* Feasibility report statement from AI */}
                            {prop.analysis && (
                              <div className="mt-2 p-2.5 bg-slate-100/50 dark:bg-slate-950/40 rounded-lg border border-slate-200/20 dark:border-slate-800/20">
                                <span className="text-[9px] font-bold text-indigo-500 uppercase tracking-wide block mb-0.5">AI Feasibility Audit:</span>
                                <p className="text-[10px] text-slate-500 leading-normal italic">"{prop.analysis}"</p>
                              </div>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-450">
                        <span className="text-3xl block mb-2">💡</span>
                        <p className="text-sm font-semibold">No community proposals registered yet.</p>
                        <p className="text-xs text-slate-450 mt-1">Submit your first community project using the planner form on the left.</p>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* TAB 10: PREDICTIVE MAINTENANCE INTELLIGENCE */}
          {activeTab === 'maintenance' && (
            <div className="flex flex-col gap-0">
              <PredictiveMaintenance isDarkMode={isDarkMode} />
            </div>
          )}

          {/* TAB 11: MULTI-AGENT COORDINATION LOG */}
          {activeTab === 'agentlog' && (
            <div className="flex flex-col gap-0">
              <AgentTimeline
                isDarkMode={isDarkMode}
                liveWeather={liveWeather}
                liveAqi={liveAqi}
                tickets={tickets}
              />
            </div>
          )}

        </div>

        {/* Footer log monitor console */}
        <footer className="bg-slate-50 dark:bg-slate-900 border-t border-slate-250 dark:border-slate-800 p-3 text-[10px] font-mono text-slate-500 flex justify-between items-center">
          <span>Active Session ID: SM-DI-9428-26</span>
          <span className="truncate max-w-md">Latest Action: {systemLogs[0]}</span>
        </footer>
      </main>

      {/* Draggable floating round chatbot button */}
      <button
        style={{
          position: 'fixed',
          left: `${copilotBtnPos.x}px`,
          top: `${copilotBtnPos.y}px`,
          zIndex: 10000,
          cursor: dragRef.current.isDragging ? 'grabbing' : 'grab',
        }}
        onMouseDown={handleMouseDown}
        className="floating-chatbot-btn"
        title="Drag to reposition / Click to ask AI Copilot"
      >
        <Bot className="w-5 h-5 animate-pulse" />
      </button>

      {/* Notification Center overlay */}
      <NotificationCenter
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        alerts={alerts}
        isDarkMode={isDarkMode}
        onMarkRead={(id) => setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a))}
        onMarkAllRead={() => setAlerts(prev => prev.map(a => ({ ...a, read: true })))}
      />

      {/* Copilot overlay */}
      <AICopilot 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)}
        onActionTriggered={executeCopilotAction}
        liveWeather={liveWeather}
        liveAqi={liveAqi}
        tickets={tickets}
        sustainability={sustainability}
        liveTransport={liveTransport}
      />
    </div>
  );
}
