import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const SEVERITY_COLORS = {
  Critical: { bg: 'rgba(239,68,68,0.12)', border: '#ef4444', text: '#ef4444' },
  High:     { bg: 'rgba(249,115,22,0.12)', border: '#f97316', text: '#f97316' },
  Medium:   { bg: 'rgba(245,158,11,0.12)', border: '#f59e0b', text: '#f59e0b' },
  Low:      { bg: 'rgba(16,185,129,0.12)', border: '#10b981', text: '#10b981' },
};

const RISK_GRADIENT = {
  Critical: 'linear-gradient(135deg,#ef4444,#dc2626)',
  High:     'linear-gradient(135deg,#f97316,#ea580c)',
  Moderate: 'linear-gradient(135deg,#f59e0b,#d97706)',
  Low:      'linear-gradient(135deg,#10b981,#059669)',
};

export default function PublicSafety({ isDarkMode, cityInfo, _liveWeather, _liveAqi, _tickets = [] }) {
  const [incidents, setIncidents] = useState(null);
  const [services, setServices] = useState(null);
  const [riskScore, setRiskScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeIncident, setActiveIncident] = useState(null);
  const [activeTab, setActiveTab] = useState('map');
  const [filterType, setFilterType] = useState('all');
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);

  const city = cityInfo?.label || 'Mumbai';
  const lat = cityInfo?.lat || 19.076;
  const lng = cityInfo?.lng || 72.8777;

  const bg = isDarkMode ? '#0f172a' : '#f8fafc';
  const card = isDarkMode ? '#1e293b' : '#ffffff';
  const border = isDarkMode ? '#334155' : '#e2e8f0';
  const text = isDarkMode ? '#f1f5f9' : '#0f172a';
  const muted = isDarkMode ? '#94a3b8' : '#64748b';

  useEffect(() => {
    const geoQ = `lat=${lat}&lng=${lng}&city=${encodeURIComponent(city)}`;
    setLoading(true);
    setIncidents(null);
    setServices(null);
    setRiskScore(null);
    Promise.all([
      fetch(`/api/safety/incidents?${geoQ}`).then(r => r.json()).catch(() => null),
      fetch(`/api/safety/services?${geoQ}`).then(r => r.json()).catch(() => null),
      fetch(`/api/safety/risk-score?${geoQ}`).then(r => r.json()).catch(() => null),
    ]).then(([inc, svc, risk]) => {
      setIncidents(inc);
      setServices(svc);
      setRiskScore(risk);
      setLoading(false);
    });
  }, [city, lat, lng]);

  // Initialize Leaflet map
  useEffect(() => {
    if (activeTab !== 'map' || !incidents || !mapRef.current) return;

    const initMap = async () => {
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      if (!window.L) {
        await new Promise(resolve => {
          const script = document.createElement('script');
          script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const L = window.L;
      if (!mapRef.current) return;
      if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; }

      const map = L.map(mapRef.current, { center: [lat, lng], zoom: 12, zoomControl: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors', maxZoom: 18,
      }).addTo(map);
      leafletMapRef.current = map;

      const filtered = filterType === 'all' ? incidents.incidents : incidents.incidents.filter(i => i.type === filterType);
      filtered.forEach(inc => {
        const icon = L.divIcon({
          className: '',
          html: `<div style="width:32px;height:32px;border-radius:50%;background:${inc.color};border:3px solid white;display:flex;align-items:center;justify-content:center;font-size:14px;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,0.4);">${inc.icon}</div>`,
          iconSize: [32, 32], iconAnchor: [16, 16],
        });
        L.marker([inc.lat, inc.lng], { icon }).addTo(map)
          .bindPopup(`<div style="min-width:190px;font-family:system-ui,sans-serif;"><b style="font-size:14px;">${inc.icon} ${inc.label}</b><br/><span style="color:#64748b;font-size:12px;">🕐 ${inc.reported_at} · 👮 ${inc.responders} unit(s)</span><br/><span style="font-size:12px;">Status: <b style="color:${inc.status==='Active'?'#ef4444':inc.status==='Responding'?'#f59e0b':'#10b981'}">${inc.status}</b></span><br/><small style="color:#64748b;">${inc.description}</small></div>`)
          .on('click', () => setActiveIncident(inc));
      });

      services?.services?.forEach(svc => {
        const svcIcon = L.divIcon({
          className: '',
          html: `<div style="width:28px;height:28px;border-radius:6px;background:white;border:2px solid #334155;display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 1px 4px rgba(0,0,0,0.25);">${svc.icon}</div>`,
          iconSize: [28, 28], iconAnchor: [14, 14],
        });
        L.marker([svc.lat, svc.lng], { icon: svcIcon }).addTo(map)
          .bindPopup(`<div style="min-width:160px;font-family:system-ui,sans-serif;"><b>${svc.icon} ${svc.name}</b><br/><span style="color:#64748b;font-size:12px;">${svc.type}</span><br/><span style="font-size:12px;">📞 ${svc.phone}</span></div>`);
      });
    };

    const t = setTimeout(initMap, 150);
    return () => { clearTimeout(t); if (leafletMapRef.current) { leafletMapRef.current.remove(); leafletMapRef.current = null; } };
  }, [activeTab, incidents, services, filterType, lat, lng]);

  const weekChartOption = incidents?.week_trend ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['Accidents', 'Fire', 'Law & Order', 'Medical'], textStyle: { color: muted, fontSize: 11 }, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
    xAxis: { type: 'category', data: incidents.week_trend.days, axisLine: { lineStyle: { color: border } }, axisLabel: { color: muted, fontSize: 11 } },
    yAxis: { type: 'value', axisLine: { lineStyle: { color: border } }, splitLine: { lineStyle: { color: isDarkMode ? '#1e293b' : '#f1f5f9' } }, axisLabel: { color: muted, fontSize: 11 } },
    series: [
      { name: 'Accidents',   type: 'bar', stack: 'total', data: incidents.week_trend.accident, itemStyle: { color: '#f97316' } },
      { name: 'Fire',        type: 'bar', stack: 'total', data: incidents.week_trend.fire,     itemStyle: { color: '#ef4444' } },
      { name: 'Law & Order', type: 'bar', stack: 'total', data: incidents.week_trend.police,   itemStyle: { color: '#6366f1' } },
      { name: 'Medical',     type: 'bar', stack: 'total', data: incidents.week_trend.medical,  itemStyle: { color: '#10b981', borderRadius: [4,4,0,0] } },
    ],
  } : null;

  const FILTER_TYPES = [
    { id: 'all', label: 'All', icon: '🗺️' }, { id: 'accident', label: 'Accidents', icon: '🚗' },
    { id: 'fire', label: 'Fire', icon: '🔥' }, { id: 'police', label: 'Police', icon: '🚨' },
    { id: 'medical', label: 'Medical', icon: '🚑' }, { id: 'flooding', label: 'Flooding', icon: '💧' }, { id: 'power', label: 'Power', icon: '⚡' },
  ];

  if (loading) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:'16px' }}>
      <div style={{ width:'48px', height:'48px', border:`4px solid ${border}`, borderTopColor:'#6366f1', borderRadius:'50%', animation:'spin 1s linear infinite' }} />
      <p style={{ color:muted, fontSize:'14px' }}>Loading safety data for {city}…</p>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const risk = riskScore;
  const riskGrad = RISK_GRADIENT[risk?.risk_level] || RISK_GRADIENT.Moderate;

  return (
    <div style={{ padding:'24px', background:bg, minHeight:'100vh' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:'14px', marginBottom:'24px', flexWrap:'wrap' }}>
        <div style={{ width:'48px', height:'48px', borderRadius:'14px', background:'linear-gradient(135deg,#6366f1,#ec4899)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'22px', flexShrink:0 }}>🛡️</div>
        <div>
          <h1 style={{ fontSize:'1.5rem', fontWeight:900, color:text, margin:0 }}>Public Safety Dashboard</h1>
          <p style={{ color:muted, fontSize:'13px', margin:0 }}>Live incidents, emergency services & AI risk scoring — {city}</p>
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:'8px', flexWrap:'wrap' }}>
          <div style={{ padding:'6px 14px', borderRadius:'99px', background:`${risk?.risk_color || '#f59e0b'}20`, border:`1px solid ${risk?.risk_color || '#f59e0b'}`, color:risk?.risk_color || '#f59e0b', fontWeight:800, fontSize:'12px' }}>
            ⚠️ {risk?.risk_level || 'Moderate'} Risk
          </div>
          <div style={{ padding:'6px 14px', borderRadius:'99px', background:isDarkMode?'#1e293b':'#f1f5f9', border:`1px solid ${border}`, color:muted, fontSize:'12px', fontWeight:600 }}>
            🚨 {incidents?.total_active || 0} Active
          </div>
        </div>
      </div>

      {/* AI Risk Card */}
      {risk && (
        <div style={{ background:riskGrad, borderRadius:'20px', padding:'24px', marginBottom:'24px', color:'white', display:'grid', gridTemplateColumns:'120px 1fr', gap:'24px', alignItems:'center' }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:'3rem', fontWeight:900, lineHeight:1 }}>{risk.risk_score}</div>
            <div style={{ fontSize:'11px', opacity:0.85, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginTop:'4px' }}>Risk Score</div>
            <div style={{ marginTop:'8px', fontSize:'13px', fontWeight:800, background:'rgba(255,255,255,0.2)', borderRadius:'99px', padding:'3px 10px' }}>{risk.risk_level}</div>
          </div>
          <div>
            <p style={{ margin:'0 0 14px', fontSize:'14px', lineHeight:1.6, opacity:0.95 }}>{risk.ai_analysis?.risk_summary}</p>
            <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
              {risk.ai_analysis?.key_factors?.map((f, i) => (
                <span key={i} style={{ fontSize:'11px', background:'rgba(255,255,255,0.18)', borderRadius:'99px', padding:'3px 10px', fontWeight:600 }}>{f}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{ display:'flex', gap:'4px', marginBottom:'20px', background:isDarkMode?'#1e293b':'#f1f5f9', borderRadius:'12px', padding:'4px' }}>
        {[
          { id:'map', label:'Incident Map', icon:'🗺️' },
          { id:'services', label:'Emergency Services', icon:'🏥' },
          { id:'analytics', label:'Weekly Analytics', icon:'📊' },
          { id:'actions', label:'AI Recommendations', icon:'🤖' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            flex:1, padding:'9px 4px', border:'none', borderRadius:'9px', cursor:'pointer', fontSize:'12px', fontWeight:700, transition:'all 0.2s',
            background: activeTab===tab.id ? (isDarkMode?'#334155':'white') : 'transparent',
            color: activeTab===tab.id ? text : muted,
            boxShadow: activeTab===tab.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* MAP */}
      {activeTab==='map' && (
        <div>
          <div style={{ display:'flex', gap:'6px', marginBottom:'12px', flexWrap:'wrap' }}>
            {FILTER_TYPES.map(f => (
              <button key={f.id} onClick={() => setFilterType(f.id)} style={{
                padding:'5px 12px', borderRadius:'99px', border:`1px solid ${filterType===f.id?'#6366f1':border}`,
                background:filterType===f.id?'#6366f1':(isDarkMode?'#1e293b':'white'),
                color:filterType===f.id?'white':muted, fontSize:'11px', fontWeight:700, cursor:'pointer', transition:'all 0.15s',
              }}>{f.icon} {f.label}</button>
            ))}
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px' }}>
            <div style={{ background:card, borderRadius:'16px', border:`1px solid ${border}`, overflow:'hidden', height:'480px' }}>
              <div ref={mapRef} style={{ width:'100%', height:'100%' }} />
            </div>
            <div style={{ background:card, borderRadius:'16px', border:`1px solid ${border}`, overflow:'hidden', display:'flex', flexDirection:'column' }}>
              <div style={{ padding:'12px 14px', borderBottom:`1px solid ${border}`, fontWeight:800, fontSize:'13px', color:text }}>
                🚨 Incidents ({incidents?.incidents?.filter(i=>filterType==='all'||i.type===filterType).length||0})
              </div>
              <div style={{ overflowY:'auto', flex:1, padding:'6px' }}>
                {incidents?.incidents?.filter(i=>filterType==='all'||i.type===filterType).map(inc => (
                  <div key={inc.id} onClick={() => setActiveIncident(inc)} style={{
                    padding:'10px 12px', borderRadius:'10px', marginBottom:'5px', cursor:'pointer', transition:'all 0.15s',
                    background:activeIncident?.id===inc.id?(isDarkMode?'#1e3a5f':'#eff6ff'):(isDarkMode?'#0f172a':'#f8fafc'),
                    border:`1px solid ${activeIncident?.id===inc.id?'#3b82f6':'transparent'}`,
                  }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'15px' }}>{inc.icon}</span>
                      <span style={{ fontWeight:700, fontSize:'12px', color:text, flex:1 }}>{inc.label}</span>
                      <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 6px', borderRadius:'99px', background:inc.status==='Active'?'#fee2e2':inc.status==='Responding'?'#fef3c7':'#d1fae5', color:inc.status==='Active'?'#ef4444':inc.status==='Responding'?'#d97706':'#059669' }}>{inc.status}</span>
                    </div>
                    <div style={{ fontSize:'11px', color:muted }}>🕐 {inc.reported_at} · 👮 {inc.responders} unit(s)</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {activeIncident && (
            <div style={{ background:card, borderRadius:'14px', border:`1px solid ${border}`, padding:'16px', marginTop:'12px', display:'flex', gap:'14px', alignItems:'flex-start' }}>
              <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:`${activeIncident.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{activeIncident.icon}</div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:'14px', color:text, marginBottom:'4px' }}>{activeIncident.label} — {activeIncident.id}</div>
                <div style={{ color:muted, fontSize:'13px', marginBottom:'8px' }}>{activeIncident.description}</div>
                <div style={{ display:'flex', gap:'8px', flexWrap:'wrap' }}>
                  <span style={{ fontSize:'12px', background:isDarkMode?'#1e293b':'#f1f5f9', padding:'3px 10px', borderRadius:'99px', color:text }}>🕐 {activeIncident.reported_at}</span>
                  <span style={{ fontSize:'12px', background:isDarkMode?'#1e293b':'#f1f5f9', padding:'3px 10px', borderRadius:'99px', color:text }}>👮 {activeIncident.responders} Unit(s)</span>
                  <span style={{ fontSize:'12px', padding:'3px 10px', borderRadius:'99px', background:SEVERITY_COLORS[activeIncident.severity]?.bg, color:SEVERITY_COLORS[activeIncident.severity]?.text, fontWeight:700 }}>{activeIncident.severity}</span>
                </div>
              </div>
              <button onClick={() => setActiveIncident(null)} style={{ background:'none', border:'none', cursor:'pointer', color:muted, fontSize:'18px', padding:'4px' }}>✕</button>
            </div>
          )}
        </div>
      )}

      {/* SERVICES */}
      {activeTab==='services' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(290px,1fr))', gap:'12px' }}>
            {services?.services?.map(svc => (
              <div key={svc.id} style={{ background:card, border:`1px solid ${border}`, borderRadius:'16px', padding:'16px', display:'flex', gap:'12px', alignItems:'flex-start', transition:'transform 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform='translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform='translateY(0)'}
              >
                <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:svc.type==='Police Station'?'rgba(99,102,241,0.1)':svc.type==='Fire Station'?'rgba(239,68,68,0.1)':'rgba(16,185,129,0.1)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{svc.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:800, fontSize:'13px', color:text, marginBottom:'3px' }}>{svc.name}</div>
                  <div style={{ fontSize:'11px', color:muted, marginBottom:'6px' }}>{svc.address}</div>
                  <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
                    <span style={{ fontSize:'11px', fontWeight:700, padding:'2px 8px', borderRadius:'99px', background:isDarkMode?'#1e293b':'#f1f5f9', color:muted }}>{svc.type}</span>
                    <a href={`tel:${svc.phone}`} style={{ fontSize:'12px', fontWeight:800, color:'#6366f1', textDecoration:'none' }}>📞 {svc.phone}</a>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ background:'linear-gradient(135deg,#1e1b4b,#0f172a)', borderRadius:'20px', padding:'24px', marginTop:'20px', color:'white' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, margin:'0 0 14px' }}>🆘 National Emergency Numbers — India</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:'10px' }}>
              {[['100','Police','🚨'],['101','Fire Brigade','🔥'],['108','Ambulance','🚑'],['1070','Disaster Mgmt','⛑️'],['1091','Women Helpline','👩'],['1098','Child Helpline','🧒'],['1033','Road Accident','🚗'],['112','Unified Emergency','📞']].map(([num, label, icon]) => (
                <a key={num} href={`tel:${num}`} style={{ textDecoration:'none', display:'flex', alignItems:'center', gap:'10px', background:'rgba(255,255,255,0.08)', borderRadius:'12px', padding:'12px 14px', border:'1px solid rgba(255,255,255,0.1)', transition:'background 0.2s' }}
                  onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.15)'}
                  onMouseLeave={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
                >
                  <span style={{ fontSize:'18px' }}>{icon}</span>
                  <div><div style={{ fontSize:'11px', color:'#94a3b8' }}>{label}</div><div style={{ fontSize:'18px', fontWeight:900, color:'white' }}>{num}</div></div>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {activeTab==='analytics' && weekChartOption && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'16px' }}>
          <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'16px', padding:'20px' }}>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:text, margin:'0 0 14px' }}>📊 7-Day Incident Breakdown — {city}</h3>
            <ReactECharts option={weekChartOption} style={{ height:'340px' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
            <h3 style={{ fontSize:'13px', fontWeight:800, color:text, margin:'0 0 4px' }}>Weekly Summary</h3>
            {[{label:'Road Accidents',key:'accident',icon:'🚗',color:'#f97316'},{label:'Fire Incidents',key:'fire',icon:'🔥',color:'#ef4444'},{label:'Law & Order',key:'police',icon:'🚨',color:'#6366f1'},{label:'Medical Calls',key:'medical',icon:'🚑',color:'#10b981'}].map(({label,key,icon,color}) => {
              const total = incidents?.week_trend?.[key]?.reduce((a,b)=>a+b,0)||0;
              return (
                <div key={key} style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'8px' }}>
                    <span style={{ fontSize:'16px' }}>{icon}</span>
                    <span style={{ fontWeight:700, fontSize:'12px', color:text, flex:1 }}>{label}</span>
                    <span style={{ fontWeight:900, fontSize:'15px', color }}>{total}</span>
                  </div>
                  <div style={{ height:'5px', background:isDarkMode?'#1e293b':'#f1f5f9', borderRadius:'99px', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.min(100,(total/70)*100)}%`, background:color, borderRadius:'99px' }} />
                  </div>
                </div>
              );
            })}
            <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'14px', padding:'14px' }}>
              <div style={{ fontSize:'11px', color:muted, marginBottom:'4px' }}>Total This Week</div>
              <div style={{ fontSize:'2rem', fontWeight:900, color:text }}>
                {['accident','fire','police','medical'].reduce((sum,k)=>sum+(incidents?.week_trend?.[k]?.reduce((a,b)=>a+b,0)||0),0)}
              </div>
              <div style={{ fontSize:'11px', color:muted }}>Across all categories</div>
            </div>
          </div>
        </div>
      )}

      {/* ACTIONS */}
      {activeTab==='actions' && risk && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
          <div>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:text, margin:'0 0 14px' }}>🤖 AI Safety Recommendations</h3>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {risk.ai_analysis?.recommendations?.map((rec,i) => {
                const pC = {High:{bg:'rgba(239,68,68,0.1)',text:'#ef4444'},Medium:{bg:'rgba(245,158,11,0.1)',text:'#d97706'},Low:{bg:'rgba(16,185,129,0.1)',text:'#059669'}}[rec.priority]||{bg:'rgba(245,158,11,0.1)',text:'#d97706'};
                return (
                  <div key={i} style={{ background:card, border:`1px solid ${border}`, borderRadius:'16px', padding:'16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                      <div style={{ width:'30px', height:'30px', borderRadius:'8px', background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900, fontSize:'13px', flexShrink:0 }}>{i+1}</div>
                      <div style={{ fontWeight:800, fontSize:'14px', color:text, flex:1 }}>{rec.title}</div>
                      <span style={{ fontSize:'10px', fontWeight:800, padding:'2px 8px', borderRadius:'99px', background:pC.bg, color:pC.text }}>{rec.priority}</span>
                    </div>
                    <p style={{ margin:0, fontSize:'13px', color:muted, lineHeight:1.6 }}>{rec.action}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div>
            <h3 style={{ fontSize:'1rem', fontWeight:800, color:text, margin:'0 0 14px' }}>📡 Live Risk Signals</h3>
            <div style={{ background:card, border:`1px solid ${border}`, borderRadius:'16px', overflow:'hidden' }}>
              {[
                {label:'Temperature', value:`${risk.signals?.temperature}°C`, icon:'🌡️'},
                {label:'Precipitation', value:`${risk.signals?.precipitation} mm/hr`, icon:'🌧️', alert:risk.signals?.precipitation>0.5},
                {label:'PM2.5 AQI', value:`${risk.signals?.pm25} µg/m³`, icon:'💨', alert:risk.signals?.pm25>35},
                {label:'Open Civic Tickets', value:risk.signals?.open_tickets, icon:'📋', alert:risk.signals?.open_tickets>5},
                {label:'Time of Day', value:`${risk.signals?.hour}:00 — ${risk.signals?.day}`, icon:'🕐', alert:risk.signals?.hour>=18||risk.signals?.hour<=4},
              ].map((sig,i) => (
                <div key={i} style={{ padding:'13px 16px', borderBottom:i<4?`1px solid ${border}`:'none', display:'flex', alignItems:'center', justifyContent:'space-between', background:sig.alert?(isDarkMode?'rgba(239,68,68,0.05)':'rgba(239,68,68,0.03)'):'transparent' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                    <span style={{ fontSize:'17px' }}>{sig.icon}</span>
                    <span style={{ fontSize:'13px', color:muted }}>{sig.label}</span>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ fontWeight:800, fontSize:'13px', color:sig.alert?'#ef4444':text }}>{sig.value}</span>
                    {sig.alert && <span style={{ fontSize:'10px', background:'#fee2e2', color:'#ef4444', padding:'2px 6px', borderRadius:'99px', fontWeight:700 }}>⚠️ Risk</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .leaflet-container{font-family:system-ui,sans-serif;}`}</style>
    </div>
  );
}
