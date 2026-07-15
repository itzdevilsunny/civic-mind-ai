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

  const [voteCounts, setVoteCounts] = useState({ support: 18, oppose: 22 });
  const [hasVoted, setHasVoted] = useState(false);
  const [isSpeakingAudio, setIsSpeakingAudio] = useState(false);

  // Style injector for visual conference speak indicator voice-wave
  useEffect(() => {
    const styleId = 'senate-animation-styles';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.innerHTML = `
        @keyframes voice-wave {
          0%, 100% { height: 4px; }
          50% { height: 14px; }
        }
        .animate-voice-wave {
          animation: voice-wave 0.8s ease-in-out infinite;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const handleVote = (voteType) => {
    if (hasVoted) return;
    setVoteCounts(prev => ({
      ...prev,
      [voteType]: prev[voteType] + 1
    }));
    setHasVoted(true);

    const citizenMsg = {
      agent: "Citizen Engagement Agent",
      sentiment: voteType === 'support' ? 'supportive' : 'critical',
      message: voteType === 'support'
        ? `We have registered strong community support for this motion. Public feedback indicates confidence in the municipal team's direction.`
        : `Urgent notice: The citizen vote is leaning negative. Residents are raising critical concerns about the immediate transit adjustments.`
    };
    setVisibleMessages(prev => [...prev, citizenMsg]);
  };

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

  const defaultParams = { busTransit: 15, signalTimer: 10, emergencyTeams: 45, solarFunding: 12, congestionToll: 3 };

  // Convene on initial mount with default sensible params
  useEffect(() => {
    fetchDebate(policyParams || defaultParams);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // When policyParams change after a simulation run, auto-convene the debate!
  useEffect(() => {
    if (policyParams) {
      fetchDebate(policyParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [policyParams]);

  // Handle sequential message reveal and speech playbacks
  useEffect(() => {
    if (!messages || messages.length === 0) return;

    let index = 0;
    let isCancelled = false;
    
    const showNextMessage = () => {
      if (isCancelled) return;
      if (index < messages.length) {
        const currentMsg = messages[index];
        if (!currentMsg) {
          setActiveSpeaker(null);
          return;
        }
        const speaker = currentMsg.agent;
        setActiveSpeaker(speaker);

        if (isSpeakingAudio && window.speechSynthesis) {
          window.speechSynthesis.cancel();
          const cleanText = currentMsg.message.replace(/[^\w\s\.,!\?]/g, '');
          const utterance = new SpeechSynthesisUtterance(cleanText);
          
          if (speaker === "Traffic Intelligence Agent") {
            utterance.pitch = 1.15;
            utterance.rate = 1.1;
          } else if (speaker === "Energy Intelligence Agent") {
            utterance.pitch = 0.9;
            utterance.rate = 0.95;
          } else if (speaker === "Public Safety Agent") {
            utterance.pitch = 0.75;
            utterance.rate = 1.0;
          } else if (speaker === "Citizen Engagement Agent") {
            utterance.pitch = 1.0;
            utterance.rate = 1.05;
          }
          
          utterance.onend = () => {
            if (isCancelled) return;
            setVisibleMessages(prev => [...prev, currentMsg]);
            setActiveSpeaker(null);
            index++;
            setTimeout(showNextMessage, 1000);
          };
          
          utterance.onerror = () => {
            if (isCancelled) return;
            setVisibleMessages(prev => [...prev, currentMsg]);
            setActiveSpeaker(null);
            index++;
            setTimeout(showNextMessage, 1000);
          };
          
          window.speechSynthesis.speak(utterance);
        } else {
          // Standard silent mode with timeout reveal
          setTimeout(() => {
            if (isCancelled) return;
            const msgToAppend = messages[index];
            if (msgToAppend) {
              setVisibleMessages(prev => [...prev, msgToAppend]);
            }
            setActiveSpeaker(null);
            index++;
            
            setTimeout(showNextMessage, 1000);
          }, 1800);
        }
      } else {
        // Finished all messages, turn off speaking toggle
        setIsSpeakingAudio(false);
      }
    };

    showNextMessage();
    
    return () => {
      isCancelled = true;
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [messages, isSpeakingAudio]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [visibleMessages, activeSpeaker]);

  const COMMISSIONERS = [
    { name: "Traffic Intelligence Agent", role: "Mobility Commissioner", avatar: "🚦", color: "from-emerald-500 to-teal-500" },
    { name: "Energy Intelligence Agent", role: "Grid Commissioner", avatar: "⚡", color: "from-amber-500 to-orange-500" },
    { name: "Public Safety Agent", role: "Safety Commissioner", avatar: "🛡️", color: "from-rose-500 to-pink-500" },
  ];

  return (
    <div className="card h-full flex flex-col justify-between">
      <div className="card-header border-b border-slate-100 dark:border-slate-800 pb-3 mb-4 flex justify-between items-center">
        <div>
          <h3 className="card-title flex items-center gap-2">
            <Gavel className="w-5 h-5 text-indigo-650 dark:text-indigo-400" /> Civic AI Senate Chamber
          </h3>
          <span className="card-subtitle">AI Agents debating urban planning and policy configurations</span>
        </div>
        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              onClick={() => {
                if (isSpeakingAudio) {
                  if (window.speechSynthesis) window.speechSynthesis.cancel();
                  setIsSpeakingAudio(false);
                } else {
                  // Clear visible messages so it restarts sequentially with voice
                  setVisibleMessages([]);
                  setIsSpeakingAudio(true);
                }
              }}
              className={`btn-3d flex items-center gap-1 text-xs py-1.5 px-3 ${
                isSpeakingAudio ? 'btn-danger' : 'btn-secondary'
              }`}
              style={{ cursor: 'pointer' }}
            >
              <span>{isSpeakingAudio ? "⏹️ Stop Audio" : "🔊 Listen Live"}</span>
            </button>
          )}

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
      </div>

      {/* Visual Conference Avatars Panel */}
      <div className="grid grid-cols-3 gap-3 mb-4 p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-slate-800">
        {COMMISSIONERS.map((comm, idx) => {
          const isSpeaking = activeSpeaker === comm.name;
          return (
            <div 
              key={idx} 
              className={`flex flex-col items-center p-3 rounded-lg border transition-all duration-300 ${
                isSpeaking 
                  ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/10 shadow-md scale-102' 
                  : 'border-slate-150 dark:border-slate-800 bg-white dark:bg-slate-950'
              }`}
            >
              <div className="relative">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-tr ${comm.color} flex items-center justify-center text-lg shadow-inner`}>
                  {comm.avatar}
                </div>
                {isSpeaking && (
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-indigo-500 flex items-center justify-center text-[8px] text-white">🎙️</span>
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold mt-2 text-slate-800 dark:text-slate-205 text-center truncate w-full">{comm.role}</span>
              <span className="text-[8px] text-slate-400 font-medium">{isSpeaking ? 'Speaking...' : 'Listening'}</span>
              
              {isSpeaking && (
                <div className="flex items-center gap-0.5 mt-1.5 h-3">
                  <div className="w-[2px] h-2 bg-indigo-500 rounded animate-voice-wave" style={{ animationDelay: '0.1s' }} />
                  <div className="w-[2px] h-3 bg-indigo-500 rounded animate-voice-wave" style={{ animationDelay: '0.3s' }} />
                  <div className="w-[2px] h-1 bg-indigo-500 rounded animate-voice-wave" style={{ animationDelay: '0.2s' }} />
                  <div className="w-[2px] h-3 bg-indigo-500 rounded animate-voice-wave" style={{ animationDelay: '0.4s' }} />
                </div>
              )}
            </div>
          );
        })}
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
      <div className="flex-1 min-h-[220px] max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-3 mb-2">
        {visibleMessages.filter(Boolean).map((msg, idx) => (
          <div 
            key={idx} 
            className={`flex flex-col gap-1.5 border p-3 rounded-xl transition-all duration-300 animate-fade-in ${agentColors[msg.agent] || 'border-indigo-500/20 bg-indigo-50/5 text-indigo-600 dark:text-indigo-400 border-slate-200 bg-slate-50'}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1.5 text-xs font-bold font-sans">
                {agentIcons[msg.agent] || <MessageSquare className="w-3.5 h-3.5 animate-pulse text-indigo-500" />}
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

      {/* Live Citizen Ballot Panel */}
      <div className="mt-2 p-3 bg-indigo-50/20 dark:bg-indigo-950/10 border border-indigo-100/60 dark:border-indigo-900/30 rounded-xl">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-350 uppercase tracking-wider">Live Citizen Ballot</span>
          <span className="text-[9px] font-bold text-slate-400">{hasVoted ? 'Ballot Cast' : 'Vote Required'}</span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleVote('support')}
            disabled={hasVoted}
            className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
              hasVoted
                ? 'bg-slate-100 border-slate-200 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:hover:bg-emerald-900/30'
            }`}
          >
            <span>👍 Support Policy</span>
            <span className="text-[10px] bg-emerald-500/10 dark:bg-emerald-500/20 px-1.5 py-0.5 rounded font-mono">
              {Math.round((voteCounts.support / (voteCounts.support + voteCounts.oppose)) * 100)}%
            </span>
          </button>
          <button
            onClick={() => handleVote('oppose')}
            disabled={hasVoted}
            className={`flex-1 py-1.5 px-3 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${
              hasVoted
                ? 'bg-slate-100 border-slate-200 text-slate-450 dark:bg-slate-900 dark:border-slate-800'
                : 'bg-rose-50 border-rose-200 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/40 dark:hover:bg-rose-900/30'
            }`}
          >
            <span>👎 Oppose Policy</span>
            <span className="text-[10px] bg-rose-500/10 dark:bg-rose-500/20 px-1.5 py-0.5 rounded font-mono">
              {Math.round((voteCounts.oppose / (voteCounts.support + voteCounts.oppose)) * 100)}%
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
