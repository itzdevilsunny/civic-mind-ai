import React, { useState, useEffect, useRef } from 'react';
import { Gavel, MessageSquare, Zap, Shield, Users, TrafficCone, Loader2, Play } from 'lucide-react';

const agentIcons = {
  "Traffic Intelligence Agent": <TrafficCone className="w-4 h-4 text-emerald-500" />,
  "Energy Intelligence Agent": <Zap className="w-4 h-4 text-amber-500 animate-pulse" />,
  "Public Safety Agent": <Shield className="w-4 h-4 text-rose-500" />,
  "Citizen Engagement Agent": <Users className="w-4 h-4 text-indigo-500" />
};

const agentColors = {
  "Traffic Intelligence Agent": "border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
  "Energy Intelligence Agent": "border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400",
  "Public Safety Agent": "border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400",
  "Citizen Engagement Agent": "border-indigo-500/20 bg-indigo-500/5 text-indigo-600 dark:text-indigo-400"
};

export default function SenateChamber({ policyParams }) {
  const [topic, setTopic] = useState('Awaiting Senate Chamber Convocation...');
  const [messages, setMessages] = useState([]);
  const [visibleMessages, setVisibleMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState(null);
  const scrollRef = useRef(null);

  const fetchDebate = (paramsToUse) => {
    setLoading(true);
    setVisibleMessages([]);
    setMessages([]);
    setActiveSpeaker(null);
    setTopic("Convening City AI Senate...");

    fetch('/api/senate/debate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paramsToUse || policyParams)
    })
      .then(res => res.json())
      .then(data => {
        setTopic(data.topic);
        setMessages(data.debate);
      })
      .catch(err => {
        console.error("Senate debate fetch failed:", err);
        setTopic("Failed to convene Senate. Connection error.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // Convene on initial mount
  useEffect(() => {
    fetchDebate(policyParams);
  }, []);

  // When policyParams change, auto-convene the debate!
  useEffect(() => {
    if (policyParams) {
      fetchDebate(policyParams);
    }
  }, [policyParams]);

  // Handle sequential message reveal
  useEffect(() => {
    if (messages.length === 0) return;

    let index = 0;
    let isCancelled = false;
    
    const showNextMessage = () => {
      if (isCancelled) return;
      if (index < messages.length) {
        const speaker = messages[index].agent;
        setActiveSpeaker(speaker);

        setTimeout(() => {
          if (isCancelled) return;
          setVisibleMessages(prev => [...prev, messages[index]]);
          setActiveSpeaker(null);
          index++;
          
          setTimeout(showNextMessage, 1000);
        }, 1800);
      }
    };

    showNextMessage();
    
    return () => {
      isCancelled = true;
    };
  }, [messages]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleMessages, activeSpeaker]);

  return (
    <div className="card h-full flex flex-col justify-between">
      <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
        <div>
          <h3 className="card-title flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-650 dark:text-indigo-400" /> Civic AI Senate Chamber
          </h3>
          <span className="card-subtitle">AI Agents debating urban planning and policy configurations</span>
        </div>
        <button
          onClick={() => fetchDebate()}
          disabled={loading || activeSpeaker !== null}
          className="btn-3d btn-primary flex items-center gap-1.5 text-xs py-1.5 px-3"
          style={{ cursor: 'pointer' }}
        >
          {loading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Play className="w-3 h-3" />
          )}
          <span>{loading ? "Convening..." : "Convene Senate"}</span>
        </button>
      </div>

      {/* Gavel & Topic Banner */}
      <div className="mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl p-3 flex items-start gap-3">
        <MessageSquare className="w-4 h-4 text-indigo-600 mt-0.5 flex-shrink-0" />
        <div>
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Active Debate Resolution</div>
          <div className="text-xs font-semibold mt-0.5 text-slate-800 dark:text-slate-200">{topic}</div>
        </div>
      </div>

      {/* Debate scroll log */}
      <div className="flex-1 min-h-[300px] max-h-[400px] overflow-y-auto pr-1 flex flex-col gap-3.5 mb-2">
        {visibleMessages.map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col gap-1.5 border p-3 rounded-xl transition-all duration-300 animate-fade-in ${agentColors[msg.agent] || 'border-slate-200 bg-slate-50'}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs font-bold font-sans">
                {agentIcons[msg.agent] || <MessageSquare className="w-3.5 h-3.5" />}
                <span>{msg.agent}</span>
              </div>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                msg.sentiment === 'supportive' 
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                  : msg.sentiment === 'critical'
                  ? 'border-rose-500/20 bg-rose-500/10 text-rose-600'
                  : 'border-slate-450/20 bg-slate-450/10 text-slate-550'
              }`}>
                {msg.sentiment}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-650 dark:text-slate-350 italic font-medium">
              "{msg.message}"
            </p>
          </div>
        ))}

        {/* Typing indicator for active speaker */}
        {activeSpeaker && (
          <div className={`flex flex-col gap-1.5 border p-3 rounded-xl animate-pulse ${agentColors[activeSpeaker]}`}>
            <div className="flex items-center gap-1.5 text-xs font-bold">
              {agentIcons[activeSpeaker] || <Loader2 className="w-3 h-3 animate-spin" />}
              <span>{activeSpeaker} is speaking...</span>
            </div>
            <div className="flex items-center gap-1 mt-1 pl-1">
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading && messages.length === 0 && visibleMessages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
            <Gavel className="w-8 h-8 mb-2 stroke-1" />
            <span className="text-xs">No active senate session. Click "Convene Senate" to start.</span>
          </div>
        )}
        
        {/* Scroll anchor */}
        <div ref={scrollRef} />
      </div>
    </div>
  );
}
