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
  Wrench,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Droplets,
  Heart,
  Leaf,
  Trash2,
  HardHat,
  X
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
import PublicSafety from './components/PublicSafety';
import UrjaGrid from './components/UrjaGrid';
import WaterWatch from './components/WaterWatch';
import HealthWatch from './components/HealthWatch';
import TransitEco from './components/TransitEco';
import WasteNet from './components/WasteNet';
import InfraShield from './components/InfraShield';
import CityCommandCenter from './components/CityCommandCenter';
import TransportDashboard from './components/TransportDashboard';
import { CITIES_BY_STATE, getCityByValue } from './config/indianCities';
import { t } from './config/i18n';



const TABS = [
  { id: 'overview', icon: Building2, labelKey: 'overview', adminOnly: false },
  { id: 'transportations', icon: Car, labelKey: 'transportations', adminOnly: false },
  { id: 'traffic', icon: Camera, labelKey: 'traffic', adminOnly: false },
  { id: 'weather', icon: CloudSun, labelKey: 'weather', adminOnly: false },
  { id: 'safety', icon: ShieldAlert, labelKey: 'safety', adminOnly: false },
  { id: 'urjagrid', icon: Sun, labelKey: 'urjagrid', adminOnly: false },
  { id: 'waterwatch', icon: Droplets, labelKey: 'waterwatch', adminOnly: false },
  { id: 'healthwatch', icon: Heart, labelKey: 'healthwatch', adminOnly: false },
  { id: 'transiteco', icon: Leaf, labelKey: 'transiteco', adminOnly: false },
  { id: 'wastenet', icon: Trash2, labelKey: 'wastenet', adminOnly: false },
  { id: 'infrashield', icon: HardHat, labelKey: 'infrashield', adminOnly: false },
  { id: 'news', icon: FileText, labelKey: 'news', adminOnly: false },
  { id: 'others', icon: Users, labelKey: 'others', adminOnly: false },
  { id: 'pulse', icon: HeartPulse, labelKey: 'pulse', adminOnly: false },
  { id: 'budget', icon: IndianRupee, labelKey: 'budget', adminOnly: false },
  { id: 'proposals', icon: Lightbulb, labelKey: 'proposals', adminOnly: false },
  { id: 'maintenance', icon: Wrench, labelKey: 'maintenance', adminOnly: true },
  { id: 'agentlog', icon: Network, labelKey: 'agentlog', adminOnly: true }
];

const renderSpelledText = (text, baseDelay = 0) => {
  if (!text) return '';
  return text.split('').map((char, idx) => (
    <span 
      key={idx} 
      className="spell-char" 
      style={{ animationDelay: `${baseDelay + idx * 0.02}s` }}
    >
      {char === ' ' ? '\u00A0' : char}
    </span>
  ));
};

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [activeIncident, setActiveIncident] = useState(null);
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [activeToast, setActiveToast] = useState(null);
  const [dispatchedEmergency, setDispatchedEmergency] = useState(null);
  
  // City & Language state
  const [selectedCity, setSelectedCity] = useState(() => localStorage.getItem('civicmind_city') || 'mumbai');
  const [selectedLang, setSelectedLang] = useState(() => localStorage.getItem('civicmind_lang') || 'en');
  const cityInfo = getCityByValue(selectedCity);

  // Sign in/out and Role state
  const [isSignedIn, setIsSignedIn] = useState(() => localStorage.getItem('civicmind_signed_in') === 'true');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('civicmind_user_role') || 'citizen');

  useEffect(() => {
    if (isSignedIn) return;

    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -8% 0px',
      threshold: 0.02
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          if (entry.target.classList.contains('spell-text')) {
            observer.unobserve(entry.target);
          }
        }
      });
    }, observerOptions);

    const timeoutId = setTimeout(() => {
      const revealElements = document.querySelectorAll('.scroll-reveal, .spell-text');
      revealElements.forEach(el => observer.observe(el));
    }, 150);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [isSignedIn]);

  const handleSignIn = (role) => {
    setUserRole(role);
    setIsSignedIn(true);
    localStorage.setItem('civicmind_user_role', role);
    localStorage.setItem('civicmind_signed_in', 'true');
    if (role === 'citizen' && (activeTab === 'maintenance' || activeTab === 'agentlog')) {
      setActiveTab('overview');
    }
    setSystemLogs(prev => [`System: Logged in successfully as ${role === 'admin' ? 'City Administrator' : 'Active Citizen'}.`, ...prev]);
  };

  const handleSignOut = () => {
    setIsSignedIn(false);
    localStorage.setItem('civicmind_signed_in', 'false');
    setActiveTab('overview');
    setSystemLogs(prev => [`System: Logged out from the session.`, ...prev]);
  };

  // Tab order for Back/Next navigation
  const TAB_ORDER = ['overview','transportations','traffic','weather','safety','urjagrid','waterwatch','healthwatch','transiteco','wastenet','infrashield','news','others','pulse','budget','proposals','maintenance','agentlog'];
  const currentTabIdx = TAB_ORDER.indexOf(activeTab);
  const goBack = () => { if (currentTabIdx > 0) setActiveTab(TAB_ORDER[currentTabIdx - 1]); };
  const goNext = () => { if (currentTabIdx < TAB_ORDER.length - 1) setActiveTab(TAB_ORDER[currentTabIdx + 1]); };

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
  const [liveNews, setLiveNews] = useState({ channel: '', channel_url: '', articles: [] });
  const [tickets, setTickets] = useState([]);
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
    description: '',
    image: ''
  });

  const [proposalForm, setProposalForm] = useState({
    title: '',
    category: 'Environmental',
    district: cityInfo?.districts?.[0] || 'Central',
    description: ''
  });
  const [isSubmittingProposal, setIsSubmittingProposal] = useState(false);

  // CCTV Vision & Proposal Sentiment States
  const [cctvAnalysis, setCctvAnalysis] = useState({
    CCTV_01: null,
    CCTV_02: null,
    CCTV_03: null
  });
  const [cctvLoading, setCctvLoading] = useState({
    CCTV_01: false,
    CCTV_02: false,
    CCTV_03: false
  });
  const [proposalSentiment, setProposalSentiment] = useState({});
  const [proposalSentimentLoading, setProposalSentimentLoading] = useState({});
  
  // AI Copilot States
  const [complaintMode, setComplaintMode] = useState('form'); // 'form' | 'ai'
  const [chatMessages, setChatMessages] = useState([
    { sender: 'bot', text: 'Hello! I am your AI Civic Assistant. Describe the issue you are experiencing (e.g. location, type of infrastructure damage), and I will file the ticket for you!' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [draftedTicket, setDraftedTicket] = useState(null);
  const [timelineActiveStep, setTimelineActiveStep] = useState(-1);

  const [systemLogs, setSystemLogs] = useState([
    `Traffic Agent: ${cityInfo?.label || 'City'} Grid monitoring initialized.`,
    `Transit Agent: City metro/bus line statuses synced.`,
    "Safety Agent: OpenStreetMap interactive node layers ready."
  ]);

  // Load all live APIs from proxy endpoints — passes city lat/lng/tz so backend fetches real city data
  const loadLiveData = () => {
    const { lat, lng, tz } = cityInfo;
    const geoQ = `lat=${lat}&lng=${lng}&tz=${encodeURIComponent(tz)}`;
    const geoQ2 = `lat=${lat}&lng=${lng}`;
    const hj = r => { if (!r.ok) throw new Error(); return r.json(); };
    Promise.all([
      fetch(`/api/live/weather?${geoQ}`).then(hj).catch(() => null),
      fetch(`/api/live/aqi?${geoQ2}`).then(hj).catch(() => null),
      fetch(`/api/live/transport?city=${encodeURIComponent(cityInfo.label)}&lat=${lat}&lng=${lng}`).then(hj).catch(() => []),
      fetch(`/api/live/market`).then(hj).catch(() => null),
      fetch(`/api/live/news?city=${encodeURIComponent(cityInfo.label)}`).then(hj).catch(() => []),
      fetch('/api/tickets').then(hj).catch(() => null),
      fetch(`/api/telemetry?city=${encodeURIComponent(cityInfo.label)}&lat=${lat}&lng=${lng}`).then(hj).catch(() => []),
      fetch('/api/actions').then(hj).catch(() => []),
      fetch(`/api/live/aqi/forecast?${geoQ2}`).then(hj).catch(() => null),
      fetch(`/api/live/bikepoints?city=${encodeURIComponent(cityInfo.label)}&lat=${lat}&lng=${lng}`).then(hj).catch(() => null),
      fetch('/api/sustainability/metrics').then(hj).catch(() => null),
      fetch('/api/proposals').then(hj).catch(() => [])
    ]).then(([weather, aqi, transport, market, news, dbTickets, telemetryData, actionsData, aqiForecastData, bikepointsData, sustainabilityData, proposalsData]) => {
      if (weather) setLiveWeather(weather);
      if (aqi) setLiveAqi(aqi);
      if (transport && transport.length > 0) setLiveTransport(transport);
      if (market) setLiveMarket(market);
      if (news && news.articles && news.articles.length > 0) setLiveNews(news);
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
        setProposalForm({ title: '', category: 'Environmental', district: cityInfo?.districts?.[0] || 'Central', description: '' });
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

  // Live SSE Emergencies listener
  useEffect(() => {
    if (!cityInfo) return;
    const sseUrl = `/api/live/emergencies?city=${encodeURIComponent(cityInfo.label)}&lat=${cityInfo.lat}&lng=${cityInfo.lng}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data);
        if (parsed.type === 'EMERGENCY') {
          // RESTRICTION: Only city administrators receive live emergencies/toasts/alarms
          if (!isSignedIn || userRole !== 'admin') return;

          const evt = parsed.event;
          
          // 1. Add to alerts list
          setAlerts(prev => {
            if (prev.some(a => a.id === evt.id)) return prev;
            return [
              {
                id: evt.id,
                type: 'safety',
                title: evt.title,
                body: evt.description,
                ts: Date.now(),
                read: false,
                lat: evt.lat,
                lon: evt.lon,
                image: evt.image
              },
              ...prev
            ];
          });

          // Only play chime, show toast, and speak for new live updates
          if (evt.is_new !== false) {
            // 2. Set active slide-in toast
            setActiveToast(evt);

            // 3. Play chime
            const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-500.wav");
            audio.volume = 0.4;
            audio.play().catch(() => {});

            // 4. Voice Speech Synthesis
            if (window.speechSynthesis) {
              window.speechSynthesis.cancel();
              const utterance = new SpeechSynthesisUtterance(`Warning. New emergency alert. ${evt.title.replace(/[^\w\s]/g, '')}. ${evt.description}`);
              utterance.rate = 1.0;
              window.speechSynthesis.speak(utterance);
            }

            // 5. Add to system logs
            setSystemLogs(prev => [`Emergency Alert: ${evt.title} - ${evt.description}`, ...prev]);
          }
        }
      } catch (e) {
        console.error("Failed to parse SSE event:", e);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [selectedCity, cityInfo, userRole, isSignedIn]);

  useEffect(() => {
    if (activeToast) {
      const timer = setTimeout(() => {
        setActiveToast(null);
      }, 12000);
      return () => clearTimeout(timer);
    }
  }, [activeToast]);

  const handleEmergencyDispatch = (evt) => {
    fetch('/api/emergency/dispatch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_id: evt.id,
        action_name: `Emergency Dispatch - ${evt.title}`,
        impact: `Dispatched response unit to resolve the reported issue at coordinate: ${evt.lat.toFixed(4)}, ${evt.lon.toFixed(4)}.`
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSystemLogs(prev => [`System: Dispatched emergency response unit to ${evt.title}.`, ...prev]);
          loadLiveData();
          setDispatchedEmergency({ lat: evt.lat, lon: evt.lon, title: evt.title });
        }
      })
      .catch(err => console.error("Failed to trigger dispatch:", err));
  };

  const handleVoiceCommand = (cmd) => {
    if (cmd.type === 'CHANGE_CITY') {
      setSelectedCity(cmd.value);
      localStorage.setItem('civicmind_city', cmd.value);
    } else if (cmd.type === 'CHANGE_TAB') {
      setActiveTab(cmd.value);
    } else if (cmd.type === 'SET_DARK_MODE') {
      setIsDarkMode(cmd.value);
    }
  };

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

  const handleAnalyzeCCTV = (cameraId) => {
    setCctvLoading(prev => ({ ...prev, [cameraId]: true }));
    fetch('/api/cctv/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ camera_id: cameraId, city: cityInfo.label })
    })
      .then(r => r.json())
      .then(res => {
        setCctvAnalysis(prev => ({ ...prev, [cameraId]: res }));
        setCctvLoading(prev => ({ ...prev, [cameraId]: false }));
        setSystemLogs(prev => [`Vanguard Vision: Completed CCTV feed analysis on ${cameraId}. ${res.hazards.length} hazards identified.`, ...prev]);
      })
      .catch(err => {
        console.error("CCTV analysis error:", err);
        setCctvLoading(prev => ({ ...prev, [cameraId]: false }));
      });
  };

  const handleForecastSentiment = (proposal) => {
    setProposalSentimentLoading(prev => ({ ...prev, [proposal.id]: true }));
    fetch('/api/proposals/sentiment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        proposal_id: proposal.id,
        title: proposal.title,
        description: proposal.description,
        category: proposal.category
      })
    })
      .then(r => r.json())
      .then(res => {
        setProposalSentiment(prev => ({ ...prev, [proposal.id]: res }));
        setProposalSentimentLoading(prev => ({ ...prev, [proposal.id]: false }));
        setSystemLogs(prev => [`AI Planner: Simulated policy approval scores for Proposal ${proposal.id}.`, ...prev]);
      })
      .catch(err => {
        console.error("Sentiment forecast error:", err);
        setProposalSentimentLoading(prev => ({ ...prev, [proposal.id]: false }));
      });
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
        setComplaintForm({ title: '', category: 'Roads & Bridges', priority: 'Medium', description: '', image: '' });
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
          description: complaintForm.description,
          image: complaintForm.image
        };
        setTickets(prev => [fallbackTicket, ...prev]);
        setComplaintForm({ title: '', category: 'Roads & Bridges', priority: 'Medium', description: '', image: '' });
        setSystemLogs(prev => [`[Offline Sandbox] Local ticket ${fallbackTicket.id} registered.`, ...prev]);
        confetti({ particleCount: 80, spread: 60 });
      });
  };

  const handleCopilotSend = async (e) => {
    if (e) e.preventDefault();
    if (!chatInput.trim() || chatLoading) return;

    const userText = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setChatInput('');
    setChatLoading(true);

    try {
      const res = await fetch('/api/copilot/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: userText,
          city: cityInfo.label,
          lat: cityInfo.lat,
          lng: cityInfo.lng
        })
      });
      if (!res.ok) throw new Error('API Error');
      const parsed = await res.json();
      setDraftedTicket(parsed);
      
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `I have triaged your request and drafted a ticket:\n\n* **Title**: ${parsed.title}\n* **Category**: ${parsed.category}\n* **Priority**: ${parsed.priority}\n\nPlease review the details below to confirm and file the complaint.`
        }
      ]);
    } catch (err) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        { sender: 'bot', text: 'Sorry, I encountered an error triaging your request. Please try writing in more detail or use the manual form.' }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleFileDraftedTicket = () => {
    if (!draftedTicket) return;
    
    setTimelineActiveStep(0);
    setChatMessages(prev => [...prev, { sender: 'bot', text: 'Processing ticket details...' }]);

    setTimeout(() => {
      setTimelineActiveStep(1);
      const deptMap = {
        'Roads & Bridges': t('deptRoads', selectedLang),
        'Utilities & Lighting': t('deptUtilities', selectedLang),
        'Public Safety': t('deptPolice', selectedLang),
        'Environmental': t('deptEnv', selectedLang),
        'Transport': t('deptTransport', selectedLang),
        'Social Services': t('deptSocial', selectedLang),
      };
      const dept = deptMap[draftedTicket.category] || `${cityInfo.label} Civic Authority`;
      setChatMessages(prev => [...prev, { sender: 'bot', text: `Routing ticket to regional ${dept}...` }]);
    }, 1500);

    setTimeout(() => {
      fetch('/api/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draftedTicket)
      })
      .then(res => res.json())
      .then(createdTicket => {
        setTickets(prev => [createdTicket, ...prev]);
        setTimelineActiveStep(2);
        setChatMessages(prev => [
          ...prev,
          { sender: 'bot', text: `🎉 Success! Ticket **${createdTicket.id}** has been registered. Field dispatch is routing to PWD.` }
        ]);
        setDraftedTicket(null);
        confetti({ particleCount: 80, spread: 60 });
        setTimeout(() => setTimelineActiveStep(-1), 3000);
      })
      .catch(() => {
        const fallbackTicket = {
          id: `CMI-${Math.random().toString(16).slice(2,6).toUpperCase()}`,
          title: draftedTicket.title,
          category: draftedTicket.category,
          priority: draftedTicket.priority,
          status: 'Submission Received',
          department: draftedTicket.category,
          officer: 'Auto-Assigned',
          submittedAt: new Date().toISOString(),
          stage: 0,
          description: draftedTicket.description
        };
        setTickets(prev => [fallbackTicket, ...prev]);
        setTimelineActiveStep(2);
        setChatMessages(prev => [
          ...prev,
          { sender: 'bot', text: `🎉 Success! Ticket **${fallbackTicket.id}** registered locally.` }
        ]);
        setDraftedTicket(null);
        confetti({ particleCount: 80, spread: 60 });
        setTimeout(() => setTimelineActiveStep(-1), 3000);
      });
    }, 3000);
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
        name: liveMarket?.label || 'Nifty 50',
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
    if (tubeDelayCount > 0) alerts.push(`${tubeDelayCount} transit line delays`);
    
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

  if (!isSignedIn) {
    return (
      <div className="landing-container">
        {/* Landing Header */}
        <header className="landing-header">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between" style={{ display: 'flex', width: '100%', boxSizing: 'border-box' }}>
            <div className="text-xl font-bold flex items-center gap-2" style={{ display: 'flex', alignItems: 'center' }}>
              <span className="text-2xl">🏙️</span>
              <span className="font-extrabold tracking-tight bg-gradient-to-r from-blue-600 to-orange-500" style={{ backgroundClip: 'text', WebkitBackgroundClip: 'text', color: 'transparent', fontSize: '1.25rem' }}>CivicMind AI</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <LanguageSwitcher selectedLang={selectedLang} onLangChange={setSelectedLang} isDarkMode={isDarkMode} />
              <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ cursor: 'pointer', background: 'none', border: '1px solid rgba(148,163,184,0.2)', padding: '6px 10px', borderRadius: '6px' }} title={isDarkMode ? 'Light Mode' : 'Dark Mode'}>
                {isDarkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4" />}
              </button>
              <button onClick={() => handleSignIn('citizen')} style={{ cursor: 'pointer', padding: '7px 16px', border: '1px solid rgba(16,185,129,0.4)', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: 'rgba(16,185,129,0.08)', color: '#059669' }}>Log In as Citizen</button>
              <button onClick={() => handleSignIn('admin')} style={{ cursor: 'pointer', padding: '7px 16px', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 700, background: 'linear-gradient(135deg,#3b82f6,#6366f1)', color: 'white' }}>Log In as Admin</button>
            </div>
          </div>
        </header>

        {/* ═══ HERO ═══ */}
        <section style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#0f172a 100%)', padding: '100px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: '10%', left: '5%', width: '300px', height: '300px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(249,115,22,0.15) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: '10%', right: '5%', width: '400px', height: '400px', borderRadius: '50%', background: 'radial-gradient(circle,rgba(99,102,241,0.18) 0%,transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative', maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '99px', background: 'rgba(249,115,22,0.15)', border: '1px solid rgba(249,115,22,0.3)', marginBottom: '28px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
              <span style={{ color: '#fb923c', fontSize: '12px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Powered by Gemini AI · Live for 100+ Indian Cities</span>
            </div>
            <h1 className="spell-text is-visible" style={{ fontSize: 'clamp(2.5rem,6vw,4.5rem)', fontWeight: 900, color: '#ffffff', lineHeight: 1.1, margin: '0 0 24px', letterSpacing: '-0.03em' }}>
              {renderSpelledText("Smarter Cities Start With", 0.05)}
              <br />
              <span style={{ background: 'linear-gradient(90deg,#f97316,#fb923c,#fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                {renderSpelledText("Decision Intelligence", 0.65)}
              </span>
              <span className="spell-cursor" style={{ animation: 'spellBlink 1s step-end infinite, cursorFade 0.5s ease-out 1.5s forwards' }}>|</span>
            </h1>
            <p className="scroll-reveal" style={{ fontSize: '1.2rem', color: '#94a3b8', maxWidth: '680px', margin: '0 auto 40px', lineHeight: 1.7, transitionDelay: '0.5s' }}>
              CivicMind AI is India's first multi-agent civic governance platform — bringing real-time environmental data, AI-powered dispatch, citizen participation, and budget transparency into a single command center.
            </p>
            <div className="scroll-reveal" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px', transitionDelay: '0.7s' }}>
              <button onClick={() => handleSignIn('citizen')} onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'} style={{ cursor: 'pointer', padding: '14px 32px', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', color: '#fff', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.35)', transition: 'transform 0.2s' }}>🏘️ Enter as Citizen</button>
              <button onClick={() => handleSignIn('admin')} onMouseOver={e => e.currentTarget.style.transform='scale(1.04)'} onMouseOut={e => e.currentTarget.style.transform='scale(1)'} style={{ cursor: 'pointer', padding: '14px 32px', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', color: '#fff', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', boxShadow: '0 8px 25px rgba(99,102,241,0.35)', transition: 'transform 0.2s' }}>⚙️ Enter as Administrator</button>
            </div>
            <div className="scroll-reveal" style={{ borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 40px 80px rgba(0,0,0,0.6),0 0 0 1px rgba(249,115,22,0.2)', maxWidth: '860px', margin: '0 auto', transitionDelay: '0.9s' }}>
              <div style={{ background: '#1e293b', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#f59e0b', display: 'inline-block' }} />
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '8px' }}>civic-mind-ai.vercel.app — CivicMind AI Dashboard</span>
              </div>
              <img src="/civic_dashboard_hero.png" alt="CivicMind AI Dashboard Preview" style={{ width: '100%', display: 'block' }} />
            </div>
          </div>
        </section>

        {/* ═══ STATS ═══ */}
        <section className="scroll-reveal" style={{ background: '#ffffff', borderBottom: '1px solid #f1f5f9', padding: '40px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: '32px', textAlign: 'center' }}>
            {[{ num: '100+', label: 'Indian Cities Supported', icon: '🏙️' },{ num: '11', label: 'AI Agent Modules', icon: '🤖' },{ num: 'Real-Time', label: 'Live Data Feeds', icon: '📡' },{ num: 'Gemini', label: 'AI-Powered Analysis', icon: '✨' },{ num: '2-Role', label: 'Citizen & Admin Access', icon: '🔐' }].map((stat, i) => (
              <div key={i} className="scroll-reveal" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', transitionDelay: `${i * 0.08}s` }}>
                <span style={{ fontSize: '28px' }}>{stat.icon}</span>
                <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.02em' }}>{stat.num}</span>
                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: 500 }}>{stat.label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ═══ FEATURES DEEP DIVE ═══ */}
        <section className="scroll-reveal" style={{ background: '#f8fafc', padding: '90px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '64px' }}>
              <span style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '99px', border: '1px solid rgba(249,115,22,0.25)', marginBottom: '16px' }}>Complete Feature Set</span>
              <h2 className="spell-text" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
                {renderSpelledText("Everything Your City Needs,")}
                <br />
                {renderSpelledText("In One Platform")}
                <span className="spell-cursor" style={{ animation: 'spellBlink 1s step-end infinite, cursorFade 0.5s ease-out 1.2s forwards' }}>|</span>
              </h2>
              <p className="scroll-reveal" style={{ fontSize: '1.05rem', color: '#64748b', maxWidth: '600px', margin: '0 auto', lineHeight: 1.7, transitionDelay: '0.15s' }}>11 intelligent modules working together — from real-time environmental monitoring to AI-powered governance decisions.</p>
            </div>

            {[
              { side: 'right', img: '/civic_dashboard_hero.png', imgAlt: 'City Health Dashboard', tag: 'Module 01 · Overview', tagColor: '#6366f1', title: 'Live City Health Radar & AI Diagnosis', desc: 'Get an instant multi-dimensional view of your city\'s pulse. The Civic Health Radar aggregates scores across Transport, Environment, Infrastructure, Healthcare, Safety, and Digital Services — all updated live from sensor networks.', features: ['Real-time radar chart across 6 civic dimensions','Gemini AI writes automated diagnostic reports','Weather station with temperature, humidity & UV index','Live AQI forecasts for the next 24 hours with PM2.5 levels','Department performance indicators & open ticket stats'], iconColor: 'linear-gradient(135deg,#6366f1,#8b5cf6)' },
              { side: 'left', img: '/transport_map_feature.png', imgAlt: 'Transport Dashboard', tag: 'Module 02–03 · Transport & Traffic', tagColor: '#0ea5e9', title: 'Real-Time Transit & Traffic Intelligence', desc: 'Monitor live Metro, Bus, and Bike-sharing networks. Track route statuses, congestion zones, junction camera feeds, and predict traffic delays using historical + live data fusion.', features: ['Live Metro/Suburban rail line status (Good/Delayed/Suspended)','Active bus count and route deviation tracking','Bike-sharing station search with dock availability','Traffic junction camera feeds with AI incident detection','Predictive congestion alerts for next 2 hours'], iconColor: 'linear-gradient(135deg,#0ea5e9,#06b6d4)' },
              { side: 'right', img: '/sentiment_pulse_feature.png', imgAlt: 'Sentiment Pulse', tag: 'Module 07 · Citizen Pulse', tagColor: '#a855f7', title: 'Citizen Sentiment & Social Pulse', desc: 'Understand what citizens are feeling right now. Our AI scans live social media signals, local news sentiment, and public service ratings — then Gemini synthesizes it into actionable governance insight.', features: ['Live social mood radar across Happy, Frustrated, Concerned, Satisfied','District-wise heatmap of public sentiment scores','Real-time social feed from Hindustan Times, Dainik Jagaran','Gemini AI narrative summary of public opinion trends','Week-over-week sentiment trend charts with anomaly alerts'], iconColor: 'linear-gradient(135deg,#a855f7,#ec4899)' },
              { side: 'left', img: '/ai_dispatch_feature.png', imgAlt: 'AI Dispatch', tag: 'Module 06 · Dispatch & Copilot', tagColor: '#f59e0b', title: 'AI-Powered Dispatch & Field Coordination', desc: 'Administrators get a Gemini-powered Copilot that triages tickets, suggests field officer assignments, and automates routine dispatch decisions — cutting response times by up to 60%.', features: ['Priority-tagged incident queue (Critical/High/Medium/Low)','AI Copilot suggests officer assignments based on skill + proximity','One-click dispatch with automated confirmation messages','Multi-agent coordination log — see all AI decisions in real-time','SLA compliance tracker with escalation alerts'], iconColor: 'linear-gradient(135deg,#f59e0b,#f97316)' },
              { side: 'right', img: '/budget_analytics_feature.png', imgAlt: 'Budget Analytics', tag: 'Module 08 · Budget & Sustainability', tagColor: '#10b981', title: 'City Budget & Sustainability Analytics', desc: 'Full financial transparency for citizens. Track how municipal budgets are allocated, monitor carbon emissions, solar energy output, and compare your city\'s sustainability score against national benchmarks.', features: ['Department-wise budget breakdown: Roads, Healthcare, Education, Water','CO₂ emissions trend vs. net-zero targets','Solar panel output, battery storage & grid feed-in metrics','Ward-level expenditure comparison with equity scoring','AI-generated budget health report with recommendations'], iconColor: 'linear-gradient(135deg,#10b981,#059669)' },
            ].map((feat, fi) => (
              <div key={fi} className="scroll-reveal" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center', marginBottom: fi < 4 ? '100px' : 0 }}>
                {feat.side === 'left' && <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}><img src={feat.img} alt={feat.imgAlt} style={{ width: '100%', display: 'block' }} /></div>}
                <div>
                  <span style={{ display: 'inline-block', padding: '4px 12px', background: feat.tagColor + '18', color: feat.tagColor, fontWeight: 700, fontSize: '11px', borderRadius: '6px', marginBottom: '20px', border: `1px solid ${feat.tagColor}30` }}>{feat.tag}</span>
                  <h3 style={{ fontSize: '1.9rem', fontWeight: 900, color: '#0f172a', margin: '0 0 16px', lineHeight: 1.2 }}>{feat.title}</h3>
                  <p style={{ color: '#475569', lineHeight: 1.8, marginBottom: '24px', fontSize: '15px' }}>{feat.desc}</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {feat.features.map((f, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: feat.iconColor, color: 'white', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>✓</span>
                        <span style={{ fontSize: '14px', color: '#334155' }}>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {feat.side === 'right' && <div style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.12)', border: '1px solid #e2e8f0' }}><img src={feat.img} alt={feat.imgAlt} style={{ width: '100%', display: 'block' }} /></div>}
              </div>
            ))}
          </div>
        </section>

        {/* ═══ ALL 11 MODULES ═══ */}
        <section className="scroll-reveal" style={{ background: '#0f172a', padding: '90px 24px' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <span style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(249,115,22,0.15)', color: '#fb923c', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '99px', border: '1px solid rgba(249,115,22,0.3)', marginBottom: '16px' }}>All 11 Intelligence Modules</span>
              <h2 className="spell-text" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                {renderSpelledText("Every Tool You Need to Govern Better")}
                <span className="spell-cursor" style={{ animation: 'spellBlink 1s step-end infinite, cursorFade 0.5s ease-out 1.2s forwards' }}>|</span>
              </h2>
              <p className="scroll-reveal" style={{ color: '#94a3b8', fontSize: '1rem', maxWidth: '560px', margin: '0 auto', transitionDelay: '0.1s' }}>From live data to AI decisions — every module works together in real time.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '20px' }}>
              {[{ icon: '🏙️', title: 'City Overview', desc: 'Civic Health Radar, AI Diagnosis, weather station & department KPIs', color: '#6366f1' },{ icon: '🚇', title: 'Live Transportation', desc: 'Metro/bus/bike live status, route maps, dock search & occupancy', color: '#0ea5e9' },{ icon: '🎥', title: 'Traffic & Map', desc: 'Junction camera feeds, congestion heatmaps & AI incident detection', color: '#f59e0b' },{ icon: '🌤️', title: 'Weather & Air Quality', desc: '24hr AQI forecast, PM2.5/PM10 levels, UV index, rainfall alerts', color: '#10b981' },{ icon: '📰', title: 'City News Feed', desc: 'Live news from HT, Dainik Jagaran & local channels per city', color: '#ec4899' },{ icon: '🏛️', title: 'Senate Chamber', desc: 'Citizen proposals, AI-powered voting debates & policy passing', color: '#8b5cf6' },{ icon: '💬', title: 'Sentiment Pulse', desc: 'Social mood radar, district heatmaps & Gemini AI narrative', color: '#a855f7' },{ icon: '💰', title: 'City Budget', desc: 'Department spending, sustainability metrics & CO₂ tracking', color: '#22c55e' },{ icon: '💡', title: 'Proposals', desc: 'Submit, upvote & track community infrastructure proposals', color: '#f97316' },{ icon: '🔧', title: 'Predictive Maintenance', desc: 'AI failure prediction for electrical grids, roads & water mains', color: '#ef4444' },{ icon: '🤖', title: 'Agent Log', desc: 'Full multi-agent communication timeline & AI decision audit trail', color: '#64748b' }].map((mod, i) => (
                <div key={i} className="scroll-reveal" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '14px', padding: '22px', transition: 'background 0.25s, border-color 0.25s, opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1), transform 1.4s cubic-bezier(0.16, 1, 0.3, 1)', transitionDelay: `${(i % 3) * 0.06}s`, cursor: 'default' }} onMouseOver={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.borderColor = mod.color + '50'; }} onMouseOut={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: mod.color + '20', border: `1px solid ${mod.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', flexShrink: 0 }}>{mod.icon}</div>
                    <span style={{ fontSize: '15px', fontWeight: 700, color: '#f1f5f9' }}>{mod.title}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.6 }}>{mod.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══ ROLES ═══ */}
        <section className="scroll-reveal" style={{ background: '#f8fafc', padding: '90px 24px' }}>
          <div style={{ maxWidth: '900px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '56px' }}>
              <span style={{ display: 'inline-block', padding: '5px 14px', background: 'rgba(249,115,22,0.1)', color: '#f97316', fontWeight: 700, fontSize: '12px', letterSpacing: '0.08em', textTransform: 'uppercase', borderRadius: '99px', border: '1px solid rgba(249,115,22,0.25)', marginBottom: '16px' }}>Who Is This For?</span>
              <h2 className="spell-text" style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a', margin: '0 0 12px', letterSpacing: '-0.02em' }}>
                {renderSpelledText("Two Roles, One Platform")}
                <span className="spell-cursor" style={{ animation: 'spellBlink 1s step-end infinite, cursorFade 0.5s ease-out 1.2s forwards' }}>|</span>
              </h2>
              <p className="scroll-reveal" style={{ color: '#64748b', fontSize: '1rem', maxWidth: '500px', margin: '0 auto', transitionDelay: '0.1s' }}>Log in as a Citizen to participate, or as an Admin to govern.</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '28px' }}>
              <div className="scroll-reveal" style={{ background: '#ffffff', border: '2px solid #10b981', borderRadius: '20px', padding: '36px', boxShadow: '0 8px 32px rgba(16,185,129,0.08)', transitionDelay: '0s' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px' }}>🏘️</div>
                <span style={{ display: 'inline-block', padding: '3px 10px', background: '#d1fae5', color: '#065f46', fontSize: '11px', fontWeight: 700, borderRadius: '6px', marginBottom: '12px' }}>CITIZEN PORTAL</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>For Every Indian</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>Participate in shaping your city. Submit grievances, track repairs, upvote proposals, access live transit info, and see your tax money at work — all in one place.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['Submit & track civic tickets (roads, water, electricity)','View live transit routes & bus/metro schedules','Upvote community proposals in Senate Chamber','Read city news from regional channels','Check AQI, weather & urban air quality alerts','See city budget transparency reports'].map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#334155' }}><span style={{ color: '#10b981', fontWeight: 800, flexShrink: 0 }}>✔</span> {f}</li>
                  ))}
                </ul>
                <button onClick={() => handleSignIn('citizen')} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>🏘️ Enter as Citizen →</button>
              </div>
              <div className="scroll-reveal" style={{ background: '#ffffff', border: '2px solid #6366f1', borderRadius: '20px', padding: '36px', boxShadow: '0 8px 32px rgba(99,102,241,0.08)', transitionDelay: '0.15s' }}>
                <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', marginBottom: '20px' }}>⚙️</div>
                <span style={{ display: 'inline-block', padding: '3px 10px', background: '#e0e7ff', color: '#3730a3', fontSize: '11px', fontWeight: 700, borderRadius: '6px', marginBottom: '12px' }}>ADMIN CONSOLE</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', margin: '0 0 12px' }}>For Municipal Leaders</h3>
                <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.7, marginBottom: '24px' }}>Command your city's operations center. Monitor agents, resolve critical incidents, run predictive maintenance, analyze multi-ward data, and download governance audit reports.</p>
                <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['AI Copilot for automated dispatch & ticket routing','Multi-agent timeline & communication audit log','Predictive maintenance for electrical, roads & water','What-if simulator for policy impact analysis','City budget management & sustainability tracking','Full PDF governance report export'].map((f, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '13.5px', color: '#334155' }}><span style={{ color: '#6366f1', fontWeight: 800, flexShrink: 0 }}>✔</span> {f}</li>
                  ))}
                </ul>
                <button onClick={() => handleSignIn('admin')} style={{ width: '100%', padding: '12px', border: 'none', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#3b82f6)', color: 'white', fontWeight: 800, fontSize: '14px', cursor: 'pointer' }}>⚙️ Enter as Administrator →</button>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CTA ═══ */}
        <section className="scroll-reveal" style={{ background: 'linear-gradient(135deg,#0f172a,#1e1b4b)', padding: '90px 24px', textAlign: 'center' }}>
          <div style={{ maxWidth: '680px', margin: '0 auto' }}>
            <div style={{ fontSize: '48px', marginBottom: '20px' }}>🚀</div>
            <h2 className="spell-text" style={{ fontSize: '2.5rem', fontWeight: 900, color: '#ffffff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
              {renderSpelledText("Ready to Experience the Future of Civic Governance?")}
              <span className="spell-cursor" style={{ animation: 'spellBlink 1s step-end infinite, cursorFade 0.5s ease-out 1.8s forwards' }}>|</span>
            </h2>
            <p className="scroll-reveal" style={{ color: '#94a3b8', fontSize: '1.05rem', marginBottom: '40px', lineHeight: 1.7, transitionDelay: '0.2s' }}>Join thousands of citizens and administrators making smarter decisions with CivicMind AI — powered by Gemini, built for Bharat.</p>
            <div className="scroll-reveal" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap', transitionDelay: '0.35s' }}>
              <button onClick={() => handleSignIn('citizen')} style={{ cursor: 'pointer', padding: '14px 36px', border: 'none', borderRadius: '10px', fontWeight: 800, fontSize: '15px', color: '#fff', background: 'linear-gradient(135deg,#10b981,#059669)', boxShadow: '0 8px 25px rgba(16,185,129,0.3)' }}>🏘️ Get Started as Citizen</button>
              <button onClick={() => handleSignIn('admin')} style={{ cursor: 'pointer', padding: '14px 36px', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', fontWeight: 800, fontSize: '15px', color: '#fff', background: 'rgba(255,255,255,0.07)' }}>⚙️ Admin Console</button>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ padding: '32px 24px', textAlign: 'center', background: '#020617', color: '#475569', borderTop: '1px solid #1e293b' }}>
          <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ fontSize: '18px' }}>🏙️</span><span style={{ fontWeight: 700, color: '#94a3b8', fontSize: '14px' }}>CivicMind AI</span></div>
            <p style={{ fontSize: '13px', margin: 0 }}>© {new Date().getFullYear()} CivicMind AI Platform. Empowering cities with agents of change. Built for Bharat 🇮🇳</p>
            <div style={{ display: 'flex', gap: '16px', fontSize: '12px' }}><span>Powered by Gemini AI</span><span>•</span><span>Open Source on GitHub</span></div>
          </div>
        </footer>
      </div>
    );
  }

  const userProfile = userRole === 'admin' ? {
    name: 'Al-Amin Lousa',
    role: 'City Administrator',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
  } : {
    name: 'Pinky Sharma',
    role: 'Active Citizen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=80&q=80'
  };

  return (
    <div className="app-container">
      {/* Left Hover-Reveal Sidebar Navigation */}
      <nav className="sidebar">
        <div className="sidebar-logo">
          <span>🏙️</span>
          <span>CivicMind AI</span>
        </div>

        {/* User Profile */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem', padding: '8px 10px', borderRadius: '10px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
          <img src={userProfile.avatar} alt={userProfile.name} style={{ width: '36px', height: '36px', borderRadius: '50%', border: '2px solid #f97316', objectFit: 'cover', flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{userProfile.name}</div>
            <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px' }}>{userProfile.role}</div>
          </div>
        </div>

        <ul className="sidebar-menu">
          {TABS.filter(tab => !tab.adminOnly || userRole === 'admin').map(tab => {
            const TabIcon = tab.icon;
            return (
              <li key={tab.id} className={`menu-item ${activeTab === tab.id ? 'active' : ''}`}>
                <button onClick={() => setActiveTab(tab.id)}>
                  <TabIcon className="w-4 h-4" />
                  <span>{t(tab.labelKey, selectedLang)}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {/* Sidebar Footer Actions */}
        <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 8px' }}>
            <span className={`dot-indicator ${isBackendOnline ? 'dot-success animate-pulse' : 'dot-warning'}`}></span>
            <span style={{ fontSize: '9px', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{isBackendOnline ? 'API Sync Live' : 'Fallback Sandbox'}</span>
          </div>
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            title={isDarkMode ? 'Light Mode' : 'Dark Mode'}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', fontWeight: 600, boxSizing: 'border-box' }}
          >
            {isDarkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
          </button>
          <button
            onClick={downloadAuditPdf}
            title="Export Audit PDF"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '7px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)', color: '#9ca3af', cursor: 'pointer', fontSize: '12px', fontWeight: 600, boxSizing: 'border-box' }}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
          <button
            onClick={handleSignOut}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #e11d48, #be123c)', color: 'white', cursor: 'pointer', fontSize: '12px', fontWeight: 700, boxSizing: 'border-box' }}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>

      </nav>

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
              {isSignedIn && userRole === 'admin' && (
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
              )}
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
              {/* Back / Next nav buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={goBack}
                  disabled={currentTabIdx <= 0}
                  title="Previous tab"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '26px', height: '26px', borderRadius: '6px',
                    border: '1px solid rgba(99,102,241,0.3)',
                    background: currentTabIdx <= 0 ? 'rgba(148,163,184,0.1)' : 'rgba(99,102,241,0.12)',
                    color: currentTabIdx <= 0 ? '#94a3b8' : '#6366f1',
                    cursor: currentTabIdx <= 0 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={goNext}
                  disabled={currentTabIdx >= TAB_ORDER.length - 1}
                  title="Next tab"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '26px', height: '26px', borderRadius: '6px',
                    border: '1px solid rgba(99,102,241,0.3)',
                    background: currentTabIdx >= TAB_ORDER.length - 1 ? 'rgba(148,163,184,0.1)' : 'rgba(99,102,241,0.12)',
                    color: currentTabIdx >= TAB_ORDER.length - 1 ? '#94a3b8' : '#6366f1',
                    cursor: currentTabIdx >= TAB_ORDER.length - 1 ? 'not-allowed' : 'pointer',
                    transition: 'all 0.2s',
                    flexShrink: 0,
                  }}
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </header>

        <div className="content-body animate-fade-in">
          
           {/* TAB 1: OVERVIEW — City Command Center */}
          {activeTab === 'overview' && (
            <CityCommandCenter
              city={cityInfo?.label || 'Mumbai'}
              lat={cityInfo?.lat || 19.07}
              lng={cityInfo?.lng || 72.87}
              liveWeather={liveWeather}
              liveAqi={liveAqi}
              liveTransport={liveTransport}
              liveMarket={liveMarket}
              liveNews={liveNews}
              getCityRadarOption={getCityRadarOption}
              getAIDiagnosisSummary={getAIDiagnosisSummary}
              getMarketChartOption={getMarketChartOption}
              cityInfo={cityInfo}
              isDarkMode={isDarkMode}
              setActiveTab={setActiveTab}
            />
          )}

          {/* TAB 2: TRANSPORTATIONS — Live Dashboard */}
          {activeTab === 'transportations' && (
            <TransportDashboard
              city={cityInfo?.label || 'Mumbai'}
              cityInfo={cityInfo}
              liveTransport={liveTransport}
              liveWeather={liveWeather}
              liveAqi={liveAqi}
              bikepoints={bikepoints}
              bikeSearchQuery={bikeSearchQuery}
              setBikeSearchQuery={setBikeSearchQuery}
              filteredBikepoints={filteredBikepoints}
              activeBuses={activeBuses}
              activeTrains={activeTrains}
              userRole={userRole}
            />
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
                  userRole={userRole}
                  dispatchedEmergency={dispatchedEmergency}
                  onClearDispatch={() => setDispatchedEmergency(null)}
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
                  <style>{`
                    @keyframes scan {
                      0% { top: 0%; }
                      50% { top: 98%; }
                      100% { top: 0%; }
                    }
                  `}</style>
                  
                  {/* Camera 1 */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div className="relative overflow-hidden w-full h-40 bg-black">
                      <img 
                        src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&w=400&q=80" 
                        alt="Piccadilly Traffic" 
                        className={`w-full h-full object-cover transition-all duration-300 ${cctvLoading.CCTV_01 ? 'opacity-40 blur-sm' : ''}`} 
                      />
                      {cctvLoading.CCTV_01 && (
                        <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_12px_#6366f1]" style={{ animation: 'scan 1.2s infinite ease-in-out' }} />
                      )}
                      {cctvAnalysis.CCTV_01 && cctvAnalysis.CCTV_01.hazards.map((haz, idx) => (
                        <div
                          key={idx}
                          className="absolute border border-rose-500 bg-rose-500/15 text-[8px] font-bold text-rose-300 p-0.5 pointer-events-none rounded select-none flex flex-col justify-between"
                          style={{ left: `${haz.x}%`, top: `${haz.y}%`, width: `${haz.w}%`, height: `${haz.h}%`, boxShadow: '0 0 6px rgba(244,63,94,0.4)' }}
                        >
                          <span className="bg-rose-650 text-white px-1 py-0.2 rounded-sm text-[6px] tracking-wide block w-fit truncate">
                            {haz.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">CCTV_01: Piccadilly Circus</span>
                          {cctvAnalysis.CCTV_01 ? (
                            <span className="text-[8px] bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded">
                              {cctvAnalysis.CCTV_01.status_text}
                            </span>
                          ) : (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 font-bold px-1.5 py-0.5 rounded">
                              NORMAL FLOW
                            </span>
                          )}
                        </div>
                        {cctvAnalysis.CCTV_01 && (
                          <p className="text-[10px] text-slate-500 leading-normal mt-2">{cctvAnalysis.CCTV_01.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnalyzeCCTV('CCTV_01')}
                          disabled={cctvLoading.CCTV_01}
                          className="btn btn-secondary text-[10px] py-1 px-2.5 flex-1 flex items-center justify-center gap-1 font-bold"
                          style={{ cursor: 'pointer' }}
                        >
                          <span>🔍 Run Vision Scan</span>
                        </button>
                        {cctvAnalysis.CCTV_01 && (
                          <button
                            onClick={() => {
                              setSystemLogs(prev => [`Safety Agent: [CCTV Vision Alert] Dispatched incident response crew to Piccadilly Circus.`, ...prev]);
                              confetti({ particleCount: 80, spread: 60 });
                            }}
                            className="btn btn-primary text-[10px] py-1 px-2.5 flex items-center justify-center gap-1 font-bold"
                            style={{ cursor: 'pointer' }}
                          >
                            <span>🚨 Dispatch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Camera 2 */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div className="relative overflow-hidden w-full h-40 bg-black">
                      <img 
                        src="https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&w=400&q=80" 
                        alt="City Bridge Traffic" 
                        className={`w-full h-full object-cover transition-all duration-300 ${cctvLoading.CCTV_02 ? 'opacity-40 blur-sm' : ''}`} 
                      />
                      {cctvLoading.CCTV_02 && (
                        <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_12px_#6366f1]" style={{ animation: 'scan 1.2s infinite ease-in-out' }} />
                      )}
                      {cctvAnalysis.CCTV_02 && cctvAnalysis.CCTV_02.hazards.map((haz, idx) => (
                        <div
                          key={idx}
                          className="absolute border border-rose-500 bg-rose-500/15 text-[8px] font-bold text-rose-300 p-0.5 pointer-events-none rounded select-none flex flex-col justify-between"
                          style={{ left: `${haz.x}%`, top: `${haz.y}%`, width: `${haz.w}%`, height: `${haz.h}%`, boxShadow: '0 0 6px rgba(244,63,94,0.4)' }}
                        >
                          <span className="bg-rose-650 text-white px-1 py-0.2 rounded-sm text-[6px] tracking-wide block w-fit truncate">
                            {haz.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">CCTV_02: {cityInfo?.districts?.[2] || 'Main'} Crossing</span>
                          {cctvAnalysis.CCTV_02 ? (
                            <span className="text-[8px] bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded">
                              {cctvAnalysis.CCTV_02.status_text}
                            </span>
                          ) : (
                            <span className="text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-450 font-bold px-1.5 py-0.5 rounded">
                              NORMAL FLOW
                            </span>
                          )}
                        </div>
                        {cctvAnalysis.CCTV_02 && (
                          <p className="text-[10px] text-slate-500 leading-normal mt-2">{cctvAnalysis.CCTV_02.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnalyzeCCTV('CCTV_02')}
                          disabled={cctvLoading.CCTV_02}
                          className="btn btn-secondary text-[10px] py-1 px-2.5 flex-1 flex items-center justify-center gap-1 font-bold"
                          style={{ cursor: 'pointer' }}
                        >
                          <span>🔍 Run Vision Scan</span>
                        </button>
                        {cctvAnalysis.CCTV_02 && (
                          <button
                            onClick={() => {
                              setSystemLogs(prev => [`Safety Agent: [CCTV Vision Alert] Dispatched incident response crew to ${cityInfo?.districts?.[2] || 'Main'} Crossing.`, ...prev]);
                              confetti({ particleCount: 80, spread: 60 });
                            }}
                            className="btn btn-primary text-[10px] py-1 px-2.5 flex items-center justify-center gap-1 font-bold"
                            style={{ cursor: 'pointer' }}
                          >
                            <span>🚨 Dispatch</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Camera 3 */}
                  <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between">
                    <div className="relative overflow-hidden w-full h-40 bg-black">
                      <img 
                        src="https://images.unsplash.com/photo-1494783367193-149034c05e8f?auto=format&fit=crop&w=400&q=80" 
                        alt="City Traffic" 
                        className={`w-full h-full object-cover transition-all duration-300 ${cctvLoading.CCTV_03 ? 'opacity-40 blur-sm' : ''}`} 
                      />
                      {cctvLoading.CCTV_03 && (
                        <div className="absolute inset-x-0 h-1 bg-indigo-500 shadow-[0_0_12px_#6366f1]" style={{ animation: 'scan 1.2s infinite ease-in-out' }} />
                      )}
                      {cctvAnalysis.CCTV_03 && cctvAnalysis.CCTV_03.hazards.map((haz, idx) => (
                        <div
                          key={idx}
                          className="absolute border border-rose-500 bg-rose-500/15 text-[8px] font-bold text-rose-300 p-0.5 pointer-events-none rounded select-none flex flex-col justify-between"
                          style={{ left: `${haz.x}%`, top: `${haz.y}%`, width: `${haz.w}%`, height: `${haz.h}%`, boxShadow: '0 0 6px rgba(244,63,94,0.4)' }}
                        >
                          <span className="bg-rose-650 text-white px-1 py-0.2 rounded-sm text-[6px] tracking-wide block w-fit truncate">
                            {haz.label}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-900 flex-1 flex flex-col justify-between gap-3">
                      <div>
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs">CCTV_03: {cityInfo?.districts?.[3] || 'Secondary'} Flyover</span>
                          {cctvAnalysis.CCTV_03 ? (
                            <span className="text-[8px] bg-rose-100 dark:bg-rose-950/40 text-rose-650 dark:text-rose-400 font-bold px-1.5 py-0.5 rounded">
                              {cctvAnalysis.CCTV_03.status_text}
                            </span>
                          ) : (
                            <span className="text-[8px] bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450 font-bold px-1.5 py-0.5 rounded animate-pulse">
                              CONGESTED (84%)
                            </span>
                          )}
                        </div>
                        {cctvAnalysis.CCTV_03 && (
                          <p className="text-[10px] text-slate-500 leading-normal mt-2">{cctvAnalysis.CCTV_03.description}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAnalyzeCCTV('CCTV_03')}
                          disabled={cctvLoading.CCTV_03}
                          className="btn btn-secondary text-[10px] py-1 px-2.5 flex-1 flex items-center justify-center gap-1 font-bold"
                          style={{ cursor: 'pointer' }}
                        >
                          <span>🔍 Run Vision Scan</span>
                        </button>
                        {cctvAnalysis.CCTV_03 && (
                          <button
                            onClick={() => {
                              setSystemLogs(prev => [`Safety Agent: [CCTV Vision Alert] Dispatched incident response crew to ${cityInfo?.districts?.[3] || 'Secondary'} Flyover.`, ...prev]);
                              confetti({ particleCount: 80, spread: 60 });
                            }}
                            className="btn btn-primary text-[10px] py-1 px-2.5 flex items-center justify-center gap-1 font-bold"
                            style={{ cursor: 'pointer' }}
                          >
                            <span>🚨 Dispatch</span>
                          </button>
                        )}
                      </div>
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

          {/* TAB 5: PUBLIC SAFETY */}
          {activeTab === 'safety' && (
            <PublicSafety
              isDarkMode={isDarkMode}
              cityInfo={cityInfo}
              liveWeather={liveWeather}
              liveAqi={liveAqi}
              tickets={tickets}
            />
          )}

          {/* TAB 6: URJA GRID */}
          {activeTab === 'urjagrid' && (
            <UrjaGrid
              isDarkMode={isDarkMode}
              cityInfo={cityInfo}
              liveAqi={liveAqi}
            />
          )}

          {/* TAB 7: WATER WATCH */}
          {activeTab === 'waterwatch' && (
            <WaterWatch
              isDarkMode={isDarkMode}
              cityInfo={cityInfo}
              liveWeather={liveWeather}
            />
          )}

          {/* TAB 8: HEALTH WATCH */}
          {activeTab === 'healthwatch' && (
            <HealthWatch
              isDarkMode={isDarkMode}
              cityInfo={cityInfo}
              liveAqi={liveAqi}
            />
          )}

          {/* TAB 9: TRANSIT ECO */}
          {activeTab === 'transiteco' && (
            <TransitEco
              isDarkMode={isDarkMode}
              cityInfo={cityInfo}
              liveWeather={liveWeather}
            />
          )}

          {/* TAB 10: WASTE-NET */}
          {activeTab === 'wastenet' && (
            <WasteNet
              city={cityInfo?.label || 'Mumbai'}
              lat={cityInfo?.lat || 19.07}
              lng={cityInfo?.lng || 72.87}
            />
          )}

          {/* TAB 11: INFRA-SHIELD */}
          {activeTab === 'infrashield' && (
            <InfraShield
              city={cityInfo?.label || 'Mumbai'}
              lat={cityInfo?.lat || 19.07}
              lng={cityInfo?.lng || 72.87}
            />
          )}

          {activeTab === 'news' && (
            <div className="flex flex-col gap-6">
              <div className="card">
                <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="card-title"><FileText className="w-5 h-5 text-indigo-650" /> {cityInfo?.label || 'City'} Live News</h3>
                    {liveNews.channel ? (
                      <span className="card-subtitle">
                        Live feed via{' '}
                        <a
                          href={liveNews.channel_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-indigo-600 hover:underline"
                        >
                          {liveNews.channel}
                        </a>
                      </span>
                    ) : (
                      <span className="card-subtitle">Real-time local RSS news feed</span>
                    )}
                  </div>
                  {liveNews.channel && (
                    <a
                      href={liveNews.channel_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 text-[11px] font-bold border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100 transition-colors flex-shrink-0"
                    >
                      📡 {liveNews.channel} ↗
                    </a>
                  )}
                </div>

                {liveNews.articles && liveNews.articles.length > 0 ? (
                  <div className="news-grid">
                    {liveNews.articles.slice(0, 8).map((art, idx) => (
                      <div key={idx} className="news-card">
                        <div className="news-card-body">
                          <a href={art.link} target="_blank" rel="noopener noreferrer" className="news-card-title hover:text-indigo-650 transition-colors">
                            {art.title}
                          </a>
                          {art.description && (
                            <p className="news-card-desc line-clamp-3">{art.description}</p>
                          )}
                          <div className="news-card-footer flex items-center justify-between gap-2">
                            <span>{art.pubDate}</span>
                            {art.source && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold truncate max-w-[120px]">{art.source}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-slate-400">Loading {cityInfo?.label || 'city'} news...</div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ACTUATORS & ANALYTICS */}
          {activeTab === 'others' && (
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 gap-6">
                
                {/* Submit civic complaint (Citizens Only) */}
                {userRole === 'citizen' && (
                  <div className="card">
                    <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4">
                      <h3 className="card-title"><FileText className="w-5 h-5 text-indigo-650" /> Submit Civic Complaint</h3>
                      <span className="card-subtitle">Report infrastructure failures directly to regional maintenance engines.</span>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-slate-900 rounded-xl p-1 mb-5 w-fit border border-slate-200 dark:border-slate-800">
                      <button
                        type="button"
                        onClick={() => setComplaintMode('form')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${complaintMode === 'form' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        📋 Manual Form
                      </button>
                      <button
                        type="button"
                        onClick={() => setComplaintMode('ai')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${complaintMode === 'ai' ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-sm' : 'text-slate-400'}`}
                      >
                        🤖 AI Copilot Chat
                      </button>
                    </div>

                    {complaintMode === 'form' ? (
                      <form onSubmit={handleComplaintSubmit} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">Category</label>
                            <select 
                              value={complaintForm.category}
                              onChange={(e) => setComplaintForm(prev => ({ ...prev, category: e.target.value }))}
                              className="form-input"
                            >
                              <option value="Roads & Bridges">🛣️ Pavement & Structural Damage</option>
                              <option value="Utilities & Lighting">💡 Utilities & Electrical Grid</option>
                              <option value="Public Safety">🛡️ Public Safety & Hazard Zones</option>
                              <option value="Environmental">🌳 Garbage & Environmental Sanitation</option>
                              <option value="Transport">🚌 Public Transit Service Failures</option>
                              <option value="Social Services">🤝 Municipal Social Service Gaps</option>
                            </select>
                          </div>

                          <div className="flex flex-col gap-1.5">
                            <label className="text-xs font-semibold text-slate-500">Priority Level</label>
                            <select 
                              value={complaintForm.priority}
                              onChange={(e) => setComplaintForm(prev => ({ ...prev, priority: e.target.value }))}
                              className="form-input"
                            >
                              <option value="Low">🟢 Low Priority</option>
                              <option value="Medium">🟡 Medium Priority</option>
                              <option value="High">🟠 High Priority</option>
                              <option value="Critical">🔴 Critical (Immediate Threat)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">Issue Title</label>
                          <input 
                            type="text"
                            placeholder="Brief title summarizing the municipal issue..."
                            value={complaintForm.title}
                            onChange={(e) => setComplaintForm(prev => ({ ...prev, title: e.target.value }))}
                            className="form-input"
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">Detailed Description</label>
                          <textarea 
                            placeholder="Provide details of the problem (landmarks, danger index, duration)..."
                            value={complaintForm.description}
                            onChange={(e) => setComplaintForm(prev => ({ ...prev, description: e.target.value }))}
                            className="form-input h-24 resize-none"
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="text-xs font-semibold text-slate-500">Attach Live Image (Optional)</label>
                          <input 
                            type="file" 
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setComplaintForm(prev => ({ ...prev, image: reader.result }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="form-input text-xs" 
                          />
                          {complaintForm.image && (
                            <div className="relative mt-2 w-24 h-24 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                              <img src={complaintForm.image} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button" 
                                onClick={() => setComplaintForm(prev => ({ ...prev, image: '' }))}
                                className="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center font-bold text-[10px]"
                              >
                                ✕
                              </button>
                            </div>
                          )}
                        </div>

                        <button type="submit" className="btn btn-primary py-2.5 font-bold text-xs mt-2" style={{ cursor: 'pointer' }}>
                          Submit Complaint
                        </button>
                      </form>
                    ) : (
                      <div className="flex flex-col gap-4">
                        <div className="flex-1 flex flex-col gap-2.5 h-64 overflow-y-auto border border-slate-150 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-950/20 rounded-xl p-3">
                          {chatMessages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                              <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                                msg.sender === 'user' 
                                  ? 'bg-indigo-650 text-white rounded-tr-none' 
                                  : 'bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none shadow-sm'
                              }`}>
                                {msg.text}
                              </div>
                            </div>
                          ))}
                          {chatLoading && (
                            <div className="flex justify-start">
                              <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl rounded-tl-none px-3 py-2 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Draft ticket approval */}
                        {draftedTicket && (
                          <div className="p-4 rounded-xl border border-emerald-250 dark:border-emerald-900/40 bg-emerald-500/5 flex flex-col gap-3 my-1 animate-pulse">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">📋 Triage Draft Summary</span>
                              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${draftedTicket.priority === 'Critical' ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>{draftedTicket.priority}</span>
                            </div>
                            <div className="flex flex-col gap-1.5 text-xs text-slate-705 dark:text-slate-300">
                              <div><strong>Title:</strong> {draftedTicket.title}</div>
                              <div><strong>Category:</strong> {draftedTicket.category}</div>
                              <div><strong>Description:</strong> {draftedTicket.description}</div>
                            </div>
                            <div className="flex gap-2 mt-1">
                              <button type="button" onClick={handleFileDraftedTicket} className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold shadow-sm transition-all cursor-pointer">
                                Yes, File Complaint
                              </button>
                              <button type="button" onClick={() => { setDraftedTicket(null); setChatMessages(prev => [...prev, { sender: 'bot', text: 'Triage canceled. Write another issue description to begin.' }]); }} className="px-3.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer">
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Dispatch Triage Timeline */}
                        {timelineActiveStep >= 0 && (
                          <div className="flex flex-col gap-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/50 dark:border-slate-800/50 text-xs">
                            <span className="font-bold text-[10px] text-slate-400 uppercase tracking-wider">📡 Civic Dispatch Pipeline</span>
                            <div className="flex flex-col gap-3.5 mt-1.5">
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${timelineActiveStep >= 0 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {timelineActiveStep > 0 ? '✓' : '1'}
                                </div>
                                <span className={timelineActiveStep === 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-455'}>AI Triage Classification</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${timelineActiveStep >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {timelineActiveStep > 1 ? '✓' : '2'}
                                </div>
                                <span className={timelineActiveStep === 1 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-455'}>Routing to Municipal Board</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className={`w-5 h-5 rounded-full flex items-center justify-center font-bold text-[10px] ${timelineActiveStep >= 2 ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                  {timelineActiveStep >= 2 ? '✓' : '3'}
                                </div>
                                <span className={timelineActiveStep === 2 ? 'font-bold text-emerald-500' : 'text-slate-455'}>Ticket Registered Successfully</span>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Chat Input Bar */}
                        <form onSubmit={handleCopilotSend} className="flex gap-2">
                          <input
                            type="text"
                            value={chatInput}
                            onChange={e => setChatInput(e.target.value)}
                            placeholder="Type your issue (e.g. Broken streetlight on Sector 3)..."
                            disabled={chatLoading || draftedTicket || timelineActiveStep >= 0}
                            className="form-input flex-1"
                          />
                          <button
                            type="submit"
                            disabled={chatLoading || draftedTicket || timelineActiveStep >= 0}
                            className="px-4 py-2 rounded-lg bg-indigo-650 text-white font-bold text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            Send
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
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
                <MultiAgentStatus 
                  logsList={systemLogs} 
                  telemetry={telemetry} 
                  liveWeather={liveWeather} 
                  liveAqi={liveAqi} 
                  cityLabel={cityInfo?.label} 
                />
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

                            {/* Public Sentiment Forecast Drawer */}
                            <div className="mt-2 pt-2 border-t border-slate-200/40 dark:border-slate-800/40">
                              {!proposalSentiment[prop.id] ? (
                                <button
                                  onClick={() => handleForecastSentiment(prop)}
                                  disabled={proposalSentimentLoading[prop.id]}
                                  className="w-full btn btn-secondary text-[10px] py-1.5 flex items-center justify-center gap-1.5 font-bold"
                                  style={{ cursor: 'pointer' }}
                                >
                                  {proposalSentimentLoading[prop.id] ? (
                                    <>
                                      <span className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                                      <span>Forecasting Public Sentiment...</span>
                                    </>
                                  ) : (
                                    <>
                                      <span>📊 Predict Sentiment Radar</span>
                                    </>
                                  )}
                                </button>
                              ) : (
                                <div className="flex flex-col gap-2 p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl">
                                  <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-extrabold text-indigo-500 uppercase tracking-wide">AI DEMOGRAPHIC APPROVAL RADAR</span>
                                    <button 
                                      onClick={() => setProposalSentiment(prev => {
                                        const updated = { ...prev };
                                        delete updated[prop.id];
                                        return updated;
                                      })}
                                      className="text-slate-400 hover:text-slate-650 text-[10px]"
                                      style={{ cursor: 'pointer' }}
                                    >
                                      ✕ Clear
                                    </button>
                                  </div>
                                  
                                  <div className="h-44 w-full">
                                    <ReactECharts 
                                      option={{
                                        backgroundColor: 'transparent',
                                        radar: {
                                          indicator: proposalSentiment[prop.id].radar_indicators.map(ind => ({ name: ind.name, max: 100 })),
                                          radius: '62%',
                                          center: ['50%', '50%'],
                                          splitNumber: 4,
                                          axisName: { color: '#94a3b8', fontSize: 8 },
                                          splitLine: { lineStyle: { color: 'rgba(99,102,241,0.12)' } },
                                          splitArea: { show: false }
                                        },
                                        series: [{
                                          type: 'radar',
                                          data: [{
                                            value: proposalSentiment[prop.id].radar_indicators.map(ind => ind.score),
                                            name: 'Approval Rating',
                                            itemStyle: { color: '#6366f1' },
                                            areaStyle: { color: 'rgba(99,102,241,0.18)' }
                                          }]
                                        }]
                                      }} 
                                      style={{ height: '100%', width: '100%' }} 
                                    />
                                  </div>

                                  <p className="text-[10px] text-slate-550 dark:text-slate-350 leading-relaxed font-sans border-t border-slate-100 dark:border-slate-850 pt-2 mt-1">
                                    💡 <strong>Forecast Summary:</strong> {proposalSentiment[prop.id].summary}
                                  </p>
                                </div>
                              )}
                            </div>
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
                cityInfo={cityInfo}
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
        onVoiceCommand={handleVoiceCommand}
      />

      {/* Real-time Emergency Toast */}
      {activeToast && (
        <div className="fixed bottom-6 right-6 z-[9999] max-w-sm bg-slate-900 border border-rose-500/50 rounded-xl p-4 shadow-2xl text-white transform transition-all duration-300 translate-y-0 animate-bounce-subtle">
          <div className="flex justify-between items-start gap-3">
            <div className="flex gap-2.5 items-center">
              <span className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg text-lg animate-pulse">⚠️</span>
              <div>
                <h4 className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">Live City Emergency</h4>
                <h3 className="text-xs font-extrabold">{activeToast.title}</h3>
              </div>
            </div>
            <button onClick={() => setActiveToast(null)} className="text-slate-400 hover:text-white transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">{activeToast.description}</p>
          {activeToast.image && (
            <div className="mt-2.5 rounded-lg overflow-hidden border border-slate-800/80 max-h-32">
              <img src={activeToast.image} alt="Reported problem attachment" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="mt-3 flex gap-2 justify-end">
            <button
              onClick={() => setActiveToast(null)}
              className="text-[10px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-350 rounded border border-slate-700 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                handleEmergencyDispatch(activeToast);
                setActiveToast(null);
              }}
              className="text-[10px] px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded font-bold transition-all border border-rose-500"
            >
              Dispatch Unit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
