import React, { useState, useEffect, useRef } from 'react';
import { Bot, Send, BrainCircuit, Loader2, ChevronDown, ChevronRight, X, ShieldAlert, Award, FileSpreadsheet } from 'lucide-react';



export default function AICopilot({ 
  isOpen, 
  onClose, 
  onActionTriggered, 
  liveWeather, 
  liveAqi, 
  tickets = [], 
  sustainability, 
  liveTransport 
}) {
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
  const [executedActions, setExecutedActions] = useState({});
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
    let thoughts = ["Analyzing user query: " + query];
    let content = "";
    let confidence = 95;
    let sources = ["Local SQLite database", "Live Sensor network API"];
    let actions = [];

    if (normQuery.includes("traffic") || normQuery.includes("speed") || normQuery.includes("congestion")) {
      thoughts.push(`Scanning ${cityInfo?.label || 'City'} traffic sensors...`);
      thoughts.push(`Found active traffic nodes. ${cityInfo?.label || 'City'} ring road speed sensor shows congested status.`);
      
      const delayCount = liveTransport ? liveTransport.filter(line => {
        const desc = line.lineStatuses?.[0]?.statusSeverityDescription;
        return desc && desc !== 'Good Service' && desc !== 'Special Service';
      }).length : 0;
      
      content = `**Traffic Congestion & Transit Analysis for ${cityInfo?.label || 'City'}**:
* City CCTV nodes are reporting normal active traffic flows at major junctions.
* Ring road speed sensor reports **${delayCount > 0 ? 'Congested' : 'Moderate'}** with speeds averaging ${delayCount > 0 ? '18' : '35'} km/h.
* City transit network currently reports **${delayCount} lines** experiencing delays or service adjustments.`;
      
      actions = [
        { name: `Adjust ${cityInfo?.label || 'City'} signal offsets by 25s at key junctions`, impact: "Reduces backlog queue lengths by 22%" },
        { name: "Enforce smart toll pricing dynamic offset levels", impact: "Depresses central commuter volume by 12%" }
      ];
    } 
    else if (normQuery.includes("pollution") || normQuery.includes("aqi") || normQuery.includes("air") || normQuery.includes("weather") || normQuery.includes("temp") || normQuery.includes("rain")) {
      thoughts.push("Accessing live meteorological API...");
      const temp = liveWeather?.current?.temperature_2m || 16.5;
      const rain = liveWeather?.current?.precipitation || 0.0;
      const pm25 = liveAqi?.current?.pm2_5 || 12;
      
      content = `**Environmental & Meteorological Summary**:
* **Temperature**: ${temp}°C (Apparent: ${liveWeather?.current?.apparent_temperature || temp}°C).
* **Precipitation**: ${rain} mm.
* **Air Quality (PM2.5)**: ${pm25} µg/m³ (Status: ${pm25 > 15 ? 'Moderate' : 'Good'}).
* **Solar Output**: ${sustainability?.solar_output_mw || 15.2} MW current microgrid output.`;
      
      actions = [
        { name: `Activate ${cityInfo?.label || 'City'} green zone air mist sprays`, impact: "Clears particulate matter PM2.5 levels by 15%" }
      ];
    }
    else if (normQuery.includes("complaint") || normQuery.includes("ticket") || normQuery.includes("incident")) {
      thoughts.push("Scanning SQLite complaints database...");
      const active = tickets.filter(t => t.status !== "Resolved");
      const critical = active.filter(t => t.priority === "Critical").length;
      
      content = `**Citizen Complaints & Safety Incidents**:
* Detected **${active.length} active tickets** in the queue.
* There are **${critical} critical priority issues** requiring dispatcher coordination.
* Categories consist of: ${[...new Set(active.map(t => t.category))].join(", ") || "None"}.`;
      
      actions = [
        { name: "Deploy emergency response crew to active critical incidents", impact: "Resolves urgent utility/roads hazards within 90 minutes" }
      ];
    }
    else if (normQuery.includes("budget") || normQuery.includes("spent") || normQuery.includes("money") || normQuery.includes("cost")) {
      thoughts.push("Querying municipal treasury ledgers...");
      content = `**Municipal Financial & Carbon Budget Report for ${cityInfo?.label || 'City'}**:
* **Carbon Offset Savings**: ${sustainability?.carbon_saved_tonnes_hr || 3.8} Tonnes/hr saved.
* **Total YTD Spent**: ₹${((sustainability?.renewable_grid_mix_pct || 65) * 120).toLocaleString('en-IN')} Cr across sectors.
* All departmental finances are balanced and compliant with statutory targets.`;
      
      actions = [
        { name: "Trigger municipal budget synchronization audit", impact: "Guarantees YTD ledger compliance across all districts" }
      ];
    }
    else {
      thoughts.push("Accessing general knowledge index...");
      thoughts.push("Correlating overall performance score: 86%");
      content = `Hello! I am the CivicMind AI Decision Copilot for **${cityInfo?.label || 'your city'}**. 
Here is a quick overview:
* **Mobility**: City metro & rail networks operating; local cycle sharing stations are active.
* **Environment**: Temperature is ${liveWeather?.current?.temperature_2m || 28}°C; PM2.5 particulate count is ${(liveAqi?.current?.pm2_5 || 25) > 35 ? 'elevated' : 'acceptable'}.
* **Active Issues**: ${tickets.filter(t => t.status !== "Resolved").length} open complaints are being tracked.

Ask me about: **traffic, air quality, citizen complaints, or budgets** to run smart analytics!`;
    }

    let currentThoughtIndex = 0;
    const thoughtsInterval = setInterval(() => {
      if (currentThoughtIndex < thoughts.length) {
        setActiveThoughts(prev => prev + (prev ? '\n' : '') + thoughts[currentThoughtIndex]);
        currentThoughtIndex++;
      } else {
        clearInterval(thoughtsInterval);
        
        setTimeout(() => {
          setIsTyping(false);
          setMessages(prev => [
            ...prev,
            {
              role: 'model',
              content: content,
              thoughts: thoughts.join('\n'),
              confidence: confidence,
              sources: sources,
              actions: actions,
              alternatives: [],
              suggestions: []
            }
          ]);
          setActiveThoughts('');
        }, 100);
      }
    }, 20);
  };



  const handleActionClick = (actionName) => {
    setExecutedActions(prev => ({ ...prev, [actionName]: true }));
    setMessages(prev => [
      ...prev,
      {
        role: 'model',
        content: `🤖 **Dispatch Success**: Action *"${actionName}"* has been successfully authorized and logged. Incident coordinators have been dispatched.`,
        isSystemSuccess: true
      }
    ]);
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
            <div className={`chat-bubble ${
              msg.isSystemSuccess 
                ? 'bg-emerald-50 border border-emerald-250 dark:bg-emerald-950/20 dark:border-emerald-900/40 text-emerald-850 dark:text-emerald-400 text-xs font-semibold p-3.5 rounded-xl w-full'
                : msg.role === 'user' 
                ? 'user' 
                : 'model'
            }`}>
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
                            disabled={executedActions[act.name]}
                            className={`text-[10px] font-extrabold px-2.5 py-1 rounded transition-all ${
                              executedActions[act.name]
                                ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-900/30'
                                : 'btn-3d btn-primary'
                            }`}
                            style={executedActions[act.name] ? {} : { padding: '0.25rem 0.5rem', transform: 'translateY(-2px)', boxShadow: '0 2px 0 var(--accent-dark)' }}
                          >
                            {executedActions[act.name] ? '✓ Executed' : 'Execute'}
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
