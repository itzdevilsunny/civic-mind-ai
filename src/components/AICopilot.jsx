import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, BrainCircuit, Loader2, ChevronDown, ChevronRight, X, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';

const mockResponses = {
  "why is traffic increasing near sector 18?": {
    thoughts: [
      "Interpreting query 'traffic increasing near Sector 18'",
      "Running SELECT query on `metro_city_iot.traffic_sensors` for Sector 18...",
      "Fetched: Speed dropped to 8 mph, sensor load at 88%.",
      "Correlating traffic anomalies with environmental conditions...",
      "Detected: Rain sensors show precipitation = 12mm/hr.",
      "Cross-referencing road construction schedule database...",
      "Found: Scheduled lane maintenance on I-95 expressway off-ramp near Sector 18.",
      "Correlating emergency dispatches...",
      "Found: Minor fender-bender reported on lane 2. Accident clearance in progress.",
      "Structuring response with recommendations and confidence values."
    ],
    content: `Based on real-time telemetry, traffic congestion near **Sector 18** has spiked by **41%** compared to the baseline. This is caused by a confluence of three distinct factors:

1. **Precipitation event**: Heavy rain (12mm/hr) has slowed travel speeds.
2. **Lane closure**: Roadworks are underway on the Sector 18 exit lane.
3. **Fender-bender**: A two-vehicle accident is blocking Lane 2 of the slip road.`,
    confidence: 94,
    sources: [
      "BigQuery: `metro_city_iot.traffic_sensors` (updated 2 mins ago)",
      "BigQuery: `metro_city_env.weather_telemetry` (updated 5 mins ago)",
      "Supabase: `municipality_ops.construction_schedule`"
    ],
    actions: [
      { name: "Increase green light duration by 25s at Sector 18 junction", impact: "Reduces queue length by 35% within 15 minutes" },
      { name: "Deploy 2 traffic coordinators to route vehicles via Central Avenue", impact: "Saves an estimated 8 minutes per vehicle" },
      { name: "Send incident notification to Google Maps & local navigation apps", impact: "Diverts 15% of approaching traffic before entrance" }
    ],
    alternatives: [
      "Open temporary shoulder lane on expressway (Impact: High cost, 10 min setup)",
      "Initiate congestion pricing warning (Impact: Lower short-term compliance)"
    ]
  },
  "show top pollution areas.": {
    thoughts: [
      "Analyzing request for 'top pollution areas'",
      "Querying `metro_city_env.air_quality` grouped by sector...",
      "Averages for last 6 hours: Sector 7 (AQI 152), Sector 12 (AQI 115), Sector 4 (AQI 34).",
      "Analyzing temporal trend: Industrial zone shows consistent particulate emissions.",
      "Determining main pollutant: PM2.5 and NO2 levels are elevated in industrial pockets.",
      "Synthesizing report."
    ],
    content: `The top air pollution regions in the metropolitan area based on the last 2 hours of sensor records are:

* **Sector 7 (Industrial Park West)**: **AQI 152** (Unhealthy). Primary pollutant: PM2.5.
* **Sector 12 (Logistics Hub South)**: **AQI 115** (Moderate). Primary pollutant: NO2 (diesel fumes).
* **Sector 3 (Commercial Downtown)**: **AQI 92** (Moderate). Primary pollutant: Ozone.`,
    confidence: 88,
    sources: [
      "BigQuery: `metro_city_env.air_quality` (last hourly average)",
      "IoT Sensors: `aqi_monitors_station_west` (real-time stream)"
    ],
    actions: [
      { name: "Activate air mist cannons at Industrial Park West", impact: "Reduces immediate dust settling times by 20%" },
      { name: "Enforce heavy truck idling limits at Logistics Hub South", impact: "Lowers NO2 concentration by 12% during peak shifts" }
    ],
    alternatives: [
      "Impose partial industrial shutdown (Impact: Disruptive, High political resistance)",
      "Deploy localized portable air purifiers in public squares (Impact: Medium cost, low localized impact)"
    ]
  },
  "why are complaints increasing?": {
    thoughts: [
      "Analyzing complaints trend over last 7 days...",
      "Querying Supabase: `citizen_complaints` grouped by date and category.",
      "Data reveals: Category 'Streetlights' up 180%, 'Sanitation' up 45%.",
      "Cross-referencing streetlights anomalies with power grid alerts...",
      "Discovered: Sector 4 substation underwent repair on July 4, causing partial grid trips.",
      "Sanitation complaints correlated with waste collection trucks: Truck #4 out of service for repairs.",
      "Compiling explanation report."
    ],
    content: `Citizen complaints have increased by **26%** this week. Analysis of the categories indicates two distinct local issues:

1. **Streetlight Outages (+180%)**: Concentrated heavily in **Sector 4**. This aligns with a power grid trip at Substation E on July 4, which damaged local street lighting circuits.
2. **Garbage Overflow (+45%)**: Centered in residential clusters. This was caused by an unscheduled maintenance breakdown of Sanitation Truck #4, causing collection delays.`,
    confidence: 91,
    sources: [
      "Supabase: `citizen_complaints` (active state logs)",
      "BigQuery: `metro_city_ops.utility_logs` (power substation E logs)",
      "Supabase: `municipality_sanitation.truck_rosters`"
    ],
    actions: [
      { name: "Dispatch emergency grid team to reset circuit breakers in Sector 4", impact: "Restores 85% of offline streetlights in 3 hours" },
      { name: "Reroute Sanitation Truck #8 to cover Sector 4's missed route", impact: "Resolves waste accumulation backlogs within 12 hours" }
    ],
    alternatives: [
      "Extend municipal worker shifts (Impact: Overtime budget increased by $12k)",
      "Request citizens to hold non-hazardous waste temporarily (Impact: Poor citizen feedback)"
    ]
  }
};

export default function AICopilot({ isOpen, onClose, onActionTriggered }) {
  const [messages, setMessages] = useState([
    {
      role: 'model',
      content: "Hello! I am CivicMind's Decision Intelligence Copilot. Ask me anything about the city telemetry, complaints databases, or simulated urban scenarios.",
      thoughts: '',
      sources: [],
      actions: [],
      confidence: 100
    }
  ]);
  const [input, setInput] = useState('');
  const [activeThoughts, setActiveThoughts] = useState('');
  const [expandedThoughts, setExpandedThoughts] = useState({});
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeThoughts]);

  const toggleThoughts = (idx) => {
    setExpandedThoughts(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleSend = async (text) => {
    const query = text.trim();
    if (!query) return;

    // Add user message
    const updatedMessages = [...messages, { role: 'user', content: query }];
    setMessages(updatedMessages);
    setInput('');
    setIsTyping(true);
    setActiveThoughts('');

    try {
      // Connect to Live FastAPI SSE chat stream
      const response = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (!response.ok) throw new Error("Server response not OK");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let thoughtsText = '';
      let contentText = '';
      let sourcesList = [];
      let actionItems = [];
      let confidenceRating = 85;
      let suggestions = [];

      // Add a placeholder message for streaming updates
      const modelIdx = updatedMessages.length;
      setMessages(prev => [
        ...prev,
        { role: 'model', content: '', thoughts: '', sources: [], actions: [], confidence: 85, suggestions: [] }
      ]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        setIsTyping(false); // Hide the generic typing indicator
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop(); // Hold onto fractional lines

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (dataStr === '[DONE]') break;
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.type === 'THOUGHT') {
                thoughtsText += parsed.content + '\n';
              } else if (parsed.type === 'CONTENT') {
                contentText += parsed.content;
              } else if (parsed.type === 'METRICS') {
                confidenceRating = parsed.confidence || confidenceRating;
                sourcesList = parsed.sources || sourcesList;
                actionItems = parsed.actions || actionItems;
              } else if (parsed.type === 'SUGGESTION') {
                suggestions.push(parsed.content);
              }

              setMessages(prev => {
                const updated = [...prev];
                updated[modelIdx] = {
                  role: 'model',
                  content: contentText,
                  thoughts: thoughtsText,
                  confidence: confidenceRating,
                  sources: sourcesList,
                  actions: actionItems,
                  suggestions: suggestions
                };
                return updated;
              });
            } catch (e) {
              console.error('JSON parse fail:', dataStr, e);
            }
          }
        }
      }
    } catch (err) {
      console.warn("SSE fetch failed, falling back to local simulation:", err);
      simulateLocalResponse(query);
    }
  };

  const simulateLocalResponse = (query) => {
    const normQuery = query.toLowerCase();
    const mockAns = mockResponses[normQuery] || {
      thoughts: [
        "Analyzing user input query...",
        "Query text does not match standard cached patterns. Accessing general knowledge RAG pipeline...",
        "Scanning BigQuery datasets for relevant vectors...",
        "Correlating current city conditions: Temperature: 78°F, Humidity: 62%, Normal congestion.",
        "Generating synthetic response based on available mock databases."
      ],
      content: `I have analyzed your query: *"${query}"*. Currently, municipal systems show normal performance across all primary metrics. Let me know if you would like me to compile a specific report on air quality, transit, or energy demand.`,
      confidence: 85,
      sources: ["BigQuery Vector Index: `metro_city_kb.vector_store`"],
      actions: [
        { name: "Trigger global telemetry diagnostic", impact: "Ensures accuracy of current sensors" }
      ],
      alternatives: []
    };

    let currentThoughtIndex = 0;
    const thoughtsInterval = setInterval(() => {
      if (currentThoughtIndex < mockAns.thoughts.length) {
        setActiveThoughts(prev => prev + (prev ? '\n' : '') + mockAns.thoughts[currentThoughtIndex]);
        currentThoughtIndex++;
      } else {
        clearInterval(thoughtsInterval);
        
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              content: mockAns.content,
              thoughts: mockAns.thoughts.join('\n'),
              confidence: mockAns.confidence,
              sources: mockAns.sources,
              actions: msgActions(mockAns.actions),
              alternatives: mockAns.alternatives || [],
              suggestions: []
            }
          ]);
          setActiveThoughts('');
        }, 800);
      }
    }, 500);
  };

  const msgActions = (actions) => {
    return actions ? actions.map(act => ({ name: act.name, impact: act.impact })) : [];
  };

  const handleActionClick = (actionName) => {
    if (onActionTriggered) {
      onActionTriggered(actionName);
    }
  };

  return (
    <div className={`copilot-panel ${isOpen ? 'open' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600 animate-pulse" />
          <div>
            <h3 className="font-bold text-sm text-slate-900 dark:text-white">AI Decision Copilot</h3>
            <span className="text-[10px] text-slate-400 font-medium">Gemini 2.5 Pro Analytics Engine</span>
          </div>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
          <X className="w-4 h-4 text-slate-500" />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'model'}`}>
              {msg.content}
            </div>

            {/* AI Reasoning and Sources citation */}
            {msg.role === 'model' && msg.thoughts && (
              <div className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-2 mt-1 shadow-sm">
                <button
                  onClick={() => toggleThoughts(idx)}
                  className="flex items-center justify-between w-full text-left text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-blue-600"
                >
                  <span className="flex items-center gap-1.5">
                    <BrainCircuit className="w-3.5 h-3.5 text-blue-500" />
                    Reasoning Process
                  </span>
                  {expandedThoughts[idx] ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </button>

                {expandedThoughts[idx] && (
                  <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100/60 dark:bg-slate-950/60 p-2.5 rounded-lg border border-slate-200/50 dark:border-slate-800/50 flex flex-col gap-1.5 max-h-[160px] overflow-y-auto">
                    {msg.thoughts.split('\n').filter(line => line.trim().length > 0).map((line, i) => (
                      <div key={i} className="flex gap-1.5 items-start">
                        <span className="text-blue-400">›</span>
                        <span>{line}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Show Confidence score */}
                {msg.confidence && msg.confidence < 100 && (
                  <div className="flex items-center justify-between mt-1 text-[11px] border-t border-dashed border-slate-200 dark:border-slate-800 pt-2">
                    <div className="flex items-center gap-1 text-slate-500 font-medium">
                      <Award className="w-3.5 h-3.5 text-yellow-500" />
                      Confidence Score:
                    </div>
                    <span className={`font-bold px-1.5 py-0.5 rounded-full text-[10px] ${
                      msg.confidence >= 90 
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-400'
                    }`}>
                      {msg.confidence}%
                    </span>
                  </div>
                )}

                {/* Sources list */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-col gap-1 text-[10px] text-slate-400 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2">
                    <span className="font-semibold text-slate-500 flex items-center gap-1">
                      <FileSpreadsheet className="w-3.5 h-3.5 text-blue-400" /> Data Sources Cited:
                    </span>
                    {msg.sources.map((src, i) => (
                      <span key={i} className="pl-4 truncate font-mono">■ {src}</span>
                    ))}
                  </div>
                )}

                {/* Action recommendations with action dispatch capabilities */}
                {msg.actions && msg.actions.length > 0 && (
                  <div className="flex flex-col gap-1.5 border-t border-dashed border-slate-200 dark:border-slate-800 pt-2 mt-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-350 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-500 animate-bounce" /> Recommended Executive Actions:
                    </span>
                    {msg.actions.map((act, i) => (
                      <div key={i} className="flex flex-col gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-lg">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">{act.name}</span>
                          <button
                            onClick={() => handleActionClick(act.name)}
                            className="btn-3d btn-primary text-[10px]"
                            style={{ padding: '0.25rem 0.5rem', transform: 'translateY(-2px)', boxShadow: '0 2px 0 var(--accent-dark)' }}
                          >
                            Execute
                          </button>
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">Impact: {act.impact}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Smart Suggestions Rendering */}
            {msg.role === 'model' && msg.suggestions && msg.suggestions.length > 0 && (
              <div className="flex flex-col gap-1 mt-1.5 w-full">
                {msg.suggestions.map((s, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleSend(s)}
                    className="text-left text-[11px] bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-100/50 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 p-2 rounded-lg border border-blue-100 dark:border-blue-900/40 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {/* Live streaming indicator of thinking logs */}
        {isTyping && (
          <div className="flex flex-col gap-2 items-start">
            <div className="chat-bubble model flex items-center gap-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 py-2.5 px-4 rounded-xl text-xs text-slate-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />
              <span>Analyzing city databases...</span>
            </div>
            {activeThoughts && (
              <div className="w-full bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800 rounded-xl p-3 flex flex-col gap-1">
                <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                  <BrainCircuit className="w-3.5 h-3.5 text-blue-500 animate-spin" /> Thinking process:
                </span>
                <div className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-950 p-2 rounded max-h-[100px] overflow-y-auto">
                  {activeThoughts.split('\n').filter(line => line.trim().length > 0).map((line, i) => (
                    <div key={i} className="flex gap-1.5">
                      <span className="text-blue-400">›</span>
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Fast Prompts */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Suggested Queries</span>
        <div className="flex flex-wrap gap-1.5">
          <button 
            onClick={() => handleSend("Why is traffic increasing near Sector 18?")}
            disabled={isTyping}
            className="text-[11px] bg-white dark:bg-slate-900 hover:border-blue-500 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-350 transition-colors"
          >
            🚦 Traffic Sector 18?
          </button>
          <button 
            onClick={() => handleSend("Show top pollution areas.")}
            disabled={isTyping}
            className="text-[11px] bg-white dark:bg-slate-900 hover:border-blue-500 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-350 transition-colors"
          >
            🌫️ Top Pollution Areas
          </button>
          <button 
            onClick={() => handleSend("Why are complaints increasing?")}
            disabled={isTyping}
            className="text-[11px] bg-white dark:bg-slate-900 hover:border-blue-500 border border-slate-200 dark:border-slate-800 px-2.5 py-1 rounded-full text-slate-700 dark:text-slate-350 transition-colors"
          >
            📈 Complaints spike?
          </button>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(input)}
          placeholder="Ask Copilot a question..."
          className="form-input flex-1 text-xs"
          disabled={isTyping}
        />
        <button
          onClick={() => handleSend(input)}
          disabled={isTyping || !input.trim()}
          className="btn-3d btn-primary"
          style={{ transform: 'translateY(-2px)', padding: '0.6rem 1.1rem', boxShadow: '0 3px 0 var(--accent-dark)' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
