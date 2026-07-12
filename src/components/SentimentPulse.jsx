import { useState, useEffect, useRef } from 'react';
import ReactECharts from 'echarts-for-react';

const DISTRICT_COLORS = ['#6366f1','#f59e0b','#10b981','#3b82f6','#ec4899','#8b5cf6'];

const SENTIMENT_LABELS = {
  positive: { label: 'Positive', color: '#10b981', icon: '😊' },
  neutral: { label: 'Neutral', color: '#6366f1', icon: '😐' },
  negative: { label: 'Negative', color: '#f43f5e', icon: '😠' },
  urgent: { label: 'Urgent', color: '#f97316', icon: '🚨' },
};

const CATEGORY_ICONS = {
  'Roads & Bridges': '🛣️',
  'Utilities & Lighting': '💡',
  'Public Safety': '🛡️',
  'Environmental': '🌿',
  'Social Services': '🤝',
  'Transport': '🚌',
  'Other': '📋',
};

function AnimatedNumber({ value, decimals = 0 }) {
  const [display, setDisplay] = useState(0);
  const prevRef = useRef(0);
  useEffect(() => {
    const start = prevRef.current;
    const end = parseFloat(value) || 0;
    const steps = 40;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      const eased = 1 - Math.pow(1 - i / steps, 3);
      setDisplay(parseFloat((start + (end - start) * eased).toFixed(decimals)));
      if (i >= steps) { clearInterval(timer); prevRef.current = end; }
    }, 900 / steps);
    return () => clearInterval(timer);
  }, [value, decimals]);
  return <span>{display.toFixed(decimals)}</span>;
}

function KeywordCloud({ keywords }) {
  if (!keywords || !keywords.length) return null;
  const colors = ['#6366f1','#10b981','#f59e0b','#3b82f6','#ec4899','#8b5cf6','#f43f5e','#14b8a6'];
  return (
    <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginTop:'8px' }}>
      {keywords.map((kw, i) => {
        const size = Math.max(11, Math.min(22, 11 + (kw.weight || 1) * 2));
        const color = colors[i % colors.length];
        return (
          <span key={i} style={{ fontSize:`${size}px`, color, fontWeight: kw.weight > 3 ? 700 : 500,
            background:`${color}15`, border:`1px solid ${color}40`, borderRadius:'999px',
            padding:'3px 10px', transition:'all 0.2s', cursor:'default' }}>
            {kw.word}
          </span>
        );
      })}
    </div>
  );
}

function PulseGauge({ score }) {
  const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#f43f5e';
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Moderate' : 'Critical';
  const circ = 2 * Math.PI * 54;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'8px' }}>
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r="54" fill="none" stroke="#334155" strokeWidth="12"/>
        <circle cx="70" cy="70" r="54" fill="none" stroke={color} strokeWidth="12"
          strokeDasharray={`${(score/100)*circ} ${circ}`} strokeLinecap="round"
          style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)', filter:`drop-shadow(0 0 6px ${color}80)` }}
          transform="rotate(-90 70 70)"/>
        <text x="70" y="65" textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>
          <AnimatedNumber value={score}/>
        </text>
        <text x="70" y="84" textAnchor="middle" fontSize="11" fill="#94a3b8">{label}</text>
      </svg>
      <span style={{ fontSize:'11px', fontWeight:600, color:'#64748b' }}>City Pulse Score</span>
    </div>
  );
}

export default function SentimentPulse() {
  const [pulse, setPulse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [activeDistrict, setActiveDistrict] = useState(null);

  const fetchPulse = () => {
    setLoading(true);
    fetch('/api/sentiment/pulse')
      .then(r => r.json())
      .then(data => { setPulse(data); setLastUpdated(new Date().toLocaleTimeString()); })
      .catch(err => console.error('Pulse fetch error:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPulse();
    const t = setInterval(fetchPulse, 60000);
    return () => clearInterval(t);
  }, []);

  const radarOption = pulse ? {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'item', backgroundColor: '#1e293b', textStyle: { color: '#f1f5f9' } },
    radar: {
      indicator: (pulse.districts || []).map(d => ({ name: d.name, max: 100 })),
      center: ['50%','55%'], radius:'68%', shape:'polygon',
      axisLine: { lineStyle:{ color:'#334155' } },
      splitLine: { lineStyle:{ color:'#1e293b' } },
      splitArea: { areaStyle:{ color:['#0f172a22','#1e293b33'] } },
      name: { textStyle:{ color:'#94a3b8', fontSize:11, fontWeight:600 } },
    },
    series: [{ type:'radar', data:[{
      value: (pulse.districts||[]).map(d=>d.pulse_score||0), name:'District Pulse',
      areaStyle:{ color:{ type:'radial', x:0.5, y:0.5, r:0.5, colorStops:[{offset:0,color:'#6366f180'},{offset:1,color:'#6366f110'}] }},
      lineStyle:{ color:'#6366f1', width:2 }, itemStyle:{ color:'#6366f1' }, symbol:'circle', symbolSize:6
    }]}]
  } : null;

  const catBarOption = pulse ? {
    backgroundColor:'transparent',
    tooltip:{ trigger:'axis', backgroundColor:'#1e293b', textStyle:{ color:'#f1f5f9' } },
    legend:{ data:['Positive','Neutral','Negative'], textStyle:{ color:'#94a3b8', fontSize:10 }, top:0 },
    grid:{ left:'2%', right:'2%', top:'15%', bottom:'8%', containLabel:true },
    xAxis:{ type:'category', data:(pulse.category_breakdown||[]).map(c=>c.category.split(' ')[0]), axisLine:{lineStyle:{color:'#334155'}}, axisLabel:{color:'#94a3b8',fontSize:10} },
    yAxis:{ type:'value', axisLine:{lineStyle:{color:'#334155'}}, axisLabel:{color:'#94a3b8',fontSize:10}, splitLine:{lineStyle:{color:'#1e293b'}} },
    series:[
      { name:'Positive', type:'bar', stack:'t', data:(pulse.category_breakdown||[]).map(c=>c.positive||0), itemStyle:{color:'#10b981'} },
      { name:'Neutral',  type:'bar', stack:'t', data:(pulse.category_breakdown||[]).map(c=>c.neutral||0),  itemStyle:{color:'#6366f1'} },
      { name:'Negative', type:'bar', stack:'t', data:(pulse.category_breakdown||[]).map(c=>c.negative||0), itemStyle:{color:'#f43f5e'} },
    ]
  } : null;

  const overall = pulse?.overall_sentiment || {};
  const total = (overall.positive||0)+(overall.neutral||0)+(overall.negative||0)+(overall.urgent||0);

  const card = { background:'linear-gradient(135deg, #0f172a, #1e293b)', border:'1px solid #334155', borderRadius:'16px', padding:'20px' };

  return (
    <div style={{ padding:'24px', display:'flex', flexDirection:'column', gap:'24px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div>
          <h2 style={{ fontSize:'20px', fontWeight:900, color:'#1e293b', display:'flex', alignItems:'center', gap:'8px' }}>
            🧠 Citizen Sentiment &amp; Social Pulse
          </h2>
          <p style={{ fontSize:'11px', color:'#64748b', marginTop:'4px' }}>
            AI-powered real-time analysis of citizen feedback, district mood, and trending civic issues
            {lastUpdated && <span style={{ marginLeft:'8px', color:'#6366f1' }}>· Updated {lastUpdated}</span>}
          </p>
        </div>
        <button onClick={fetchPulse} disabled={loading}
          style={{ background:'linear-gradient(135deg, #6366f1, #8b5cf6)', color:'white', border:'none',
            padding:'8px 16px', borderRadius:'8px', fontSize:'12px', fontWeight:700,
            cursor:'pointer', opacity: loading ? 0.7 : 1, display:'flex', alignItems:'center', gap:'6px' }}>
          {loading ? '⏳' : '⚡'} {loading ? 'Analyzing...' : 'Refresh Pulse'}
        </button>
      </div>

      {loading && !pulse && (
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 0', gap:'16px' }}>
          <div style={{ width:'48px', height:'48px', borderRadius:'50%', border:'4px solid #6366f1', borderTopColor:'transparent', animation:'spin 0.8s linear infinite' }}/>
          <p style={{ fontSize:'13px', color:'#64748b' }}>Gemini AI is analyzing citizen sentiment data...</p>
        </div>
      )}

      {pulse && (
        <>
          {/* Row 1: Gauge + Sentiment + Trending */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:'16px' }}>
            <div style={{ ...card, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:'12px' }}>
              <PulseGauge score={pulse.city_pulse_score||0}/>
              <div style={{ textAlign:'center' }}>
                <p style={{ fontSize:'10px', color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>AI Assessment</p>
                <p style={{ fontSize:'11px', color:'#cbd5e1', marginTop:'4px', lineHeight:1.5 }}>{pulse.pulse_summary||'Analyzing...'}</p>
              </div>
            </div>
            <div style={{ ...card }}>
              <h3 style={{ fontSize:'11px', fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>Overall Sentiment Distribution</h3>
              {Object.entries(SENTIMENT_LABELS).map(([key, meta]) => {
                const cnt = overall[key]||0;
                const pct = total > 0 ? Math.round((cnt/total)*100) : 0;
                return (
                  <div key={key} style={{ marginBottom:'10px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontSize:'11px', marginBottom:'4px' }}>
                      <span style={{ color:'#cbd5e1', fontWeight:600 }}>{meta.icon} {meta.label}</span>
                      <span style={{ color:meta.color, fontWeight:700 }}>{cnt} ({pct}%)</span>
                    </div>
                    <div style={{ height:'8px', borderRadius:'4px', background:'#1e293b', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${pct}%`, background:meta.color, borderRadius:'4px', transition:'width 1s', boxShadow:`0 0 6px ${meta.color}80` }}/>
                    </div>
                  </div>
                );
              })}
              <p style={{ fontSize:'10px', color:'#475569', paddingTop:'8px', borderTop:'1px solid #334155', marginTop:'8px' }}>
                Total reports analyzed: <span style={{ color:'#818cf8', fontWeight:700 }}>{total}</span>
              </p>
            </div>
            <div style={{ ...card }}>
              <h3 style={{ fontSize:'11px', fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>🔥 Trending Civic Topics</h3>
              {(pulse.trending_topics||[]).slice(0,5).map((topic,i) => (
                <div key={i} style={{ display:'flex', gap:'8px', marginBottom:'10px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'11px', color:'#475569', fontWeight:900, width:'16px' }}>#{i+1}</span>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontSize:'11px', fontWeight:600, color:'#e2e8f0', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{topic.topic}</p>
                    <p style={{ fontSize:'10px', color:'#475569', marginTop:'2px' }}>{topic.mentions} mentions · {topic.category}</p>
                  </div>
                  <span style={{
                    fontSize:'10px', fontWeight:700, padding:'2px 8px', borderRadius:'999px',
                    color: topic.trend==='rising'?'#10b981':topic.trend==='falling'?'#f43f5e':'#6366f1',
                    background: topic.trend==='rising'?'#10b98120':topic.trend==='falling'?'#f43f5e20':'#6366f120',
                  }}>{topic.trend==='rising'?'↑':topic.trend==='falling'?'↓':'→'} {topic.trend}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Row 2: Radar + Category Bar */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px' }}>
            <div style={card}>
              <h3 style={{ fontSize:'11px', fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>📡 District Sentiment Radar</h3>
              {radarOption && <ReactECharts option={radarOption} style={{ height:'240px' }} opts={{ renderer:'svg' }}/>}
            </div>
            <div style={card}>
              <h3 style={{ fontSize:'11px', fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>📊 Sentiment by Category</h3>
              {catBarOption && <ReactECharts option={catBarOption} style={{ height:'240px' }} opts={{ renderer:'svg' }}/>}
            </div>
          </div>

          {/* District Cards */}
          <div>
            <h3 style={{ fontSize:'11px', fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>🗺️ District Pulse Cards</h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(6, 1fr)', gap:'12px' }}>
              {(pulse.districts||[]).map((d,i) => {
                const color = DISTRICT_COLORS[i%DISTRICT_COLORS.length];
                const isActive = activeDistrict===d.name;
                const sc = d.pulse_score>=70?'#10b981':d.pulse_score>=40?'#f59e0b':'#f43f5e';
                return (
                  <div key={i} onClick={() => setActiveDistrict(isActive?null:d.name)}
                    style={{
                      background: isActive?`${color}20`:'linear-gradient(135deg, #0f172a, #1e293b)',
                      border: isActive?`2px solid ${color}`:'1px solid #334155',
                      borderRadius:'12px', padding:'12px', cursor:'pointer',
                      transition:'all 0.3s', boxShadow: isActive?`0 0 16px ${color}40`:'none',
                    }}>
                    <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'6px' }}>
                      <span style={{ fontSize:'9px', fontWeight:900, textTransform:'uppercase', letterSpacing:'0.05em', color }}>{d.name}</span>
                      <span style={{ fontSize:'10px', fontWeight:700, color:sc }}>{d.pulse_score}</span>
                    </div>
                    <div style={{ height:'6px', borderRadius:'3px', background:'#1e293b', overflow:'hidden', marginBottom:'8px' }}>
                      <div style={{ height:'100%', width:`${d.pulse_score}%`, background:sc, transition:'width 1s' }}/>
                    </div>
                    <p style={{ fontSize:'9px', color:'#34d399' }}>😊 {d.positive_count} positive</p>
                    <p style={{ fontSize:'9px', color:'#fb7185' }}>😠 {d.negative_count} critical</p>
                    <p style={{ fontSize:'9px', color:'#fbbf24' }}>🚨 {d.urgent_count} urgent</p>
                    {isActive && d.top_issue && (
                      <div style={{ marginTop:'8px', paddingTop:'8px', borderTop:'1px solid #334155' }}>
                        <p style={{ fontSize:'9px', color:'#475569' }}>Top Issue:</p>
                        <p style={{ fontSize:'10px', color:'#e2e8f0', fontWeight:600, lineHeight:1.4 }}>{d.top_issue}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Keyword Cloud */}
          <div style={card}>
            <h3 style={{ fontSize:'11px', fontWeight:700, color:'#cbd5e1', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'4px' }}>☁️ Civic Keyword Cloud</h3>
            <KeywordCloud keywords={pulse.keyword_cloud||[]}/>
          </div>

          {/* AI Recommendations */}
          {pulse.recommendations && pulse.recommendations.length > 0 && (
            <div style={{ ...card, border:'1px solid #6366f140' }}>
              <h3 style={{ fontSize:'11px', fontWeight:700, color:'#818cf8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:'12px' }}>🤖 Gemini AI Policy Recommendations</h3>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                {pulse.recommendations.map((rec,i) => (
                  <div key={i} style={{ display:'flex', gap:'12px', padding:'12px', borderRadius:'12px', background:'#0f172a80' }}>
                    <span style={{ fontSize:'20px' }}>{CATEGORY_ICONS[rec.category]||'📋'}</span>
                    <div>
                      <p style={{ fontSize:'12px', fontWeight:700, color:'#e2e8f0' }}>{rec.title}</p>
                      <p style={{ fontSize:'10px', color:'#64748b', marginTop:'2px', lineHeight:1.5 }}>{rec.description}</p>
                      <span style={{
                        display:'inline-block', marginTop:'4px', fontSize:'9px', fontWeight:700, padding:'2px 8px', borderRadius:'999px',
                        color: rec.priority==='High'?'#f43f5e':rec.priority==='Medium'?'#f59e0b':'#10b981',
                        background: rec.priority==='High'?'#f43f5e20':rec.priority==='Medium'?'#f59e0b20':'#10b98120',
                      }}>{rec.priority} Priority</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
