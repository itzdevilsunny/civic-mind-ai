import React, { useState } from 'react';
import { FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';


export default function WorkflowTracker({ ticketsList = [], onSelectTicket }) {
  const [selectedTicket, setSelectedTicket] = useState(ticketsList[0] || null);

  const stages = [
    { name: 'Submission Received', desc: 'Complaint registered by citizen' },
    { name: 'AI Classification', desc: 'Gemini analyzed category & priority' },
    { name: 'Department Routed', desc: 'Ticket routed to department queue' },
    { name: 'Officer Dispatched', desc: 'Field technician assigned & deployed' },
    { name: 'Resolved', desc: 'Repairs completed & feedback requested' }
  ];

  const handleTicketClick = (ticket) => {
    setSelectedTicket(ticket);
    if (onSelectTicket) {
      onSelectTicket(ticket);
    }
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 'Critical': return 'bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-450';
      case 'High': return 'bg-orange-100 text-orange-850 dark:bg-orange-950/40 dark:text-orange-400';
      case 'Medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <AlertCircle className="w-4 h-4 text-amber-500" />;
    }
  };

  return (
    <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {/* Ticket List Panel */}
      <div className="border-r border-slate-100 dark:border-slate-800 pr-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Active Civic Complaint Tickets</h4>
            <span className="text-[10px] text-slate-400 font-medium">Automatic ticket pipeline routed via Gemini AI</span>
          </div>
        </div>

        <div className="flex flex-col gap-2.5 max-h-[360px] overflow-y-auto pr-1">
          {ticketsList.map(ticket => (
            <div
              key={ticket.id}
              onClick={() => handleTicketClick(ticket)}
              className={`p-3 rounded-xl border cursor-pointer transition-all ${
                selectedTicket?.id === ticket.id
                  ? 'border-blue-500 bg-blue-50/20 dark:bg-blue-950/10'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex justify-between items-start gap-2 mb-1.5">
                <span className="font-mono text-xs font-bold text-blue-600">{ticket.id}</span>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${getPriorityBadge(ticket.priority)}`}>
                    {ticket.priority}
                  </span>
                  {getStatusIcon(ticket.status)}
                </div>
              </div>
              <h5 className="font-bold text-xs text-slate-800 dark:text-slate-200 mb-1 line-clamp-1">{ticket.title}</h5>
              <div className="flex justify-between items-center text-[10px] text-slate-400 mt-2">
                <span>{ticket.department}</span>
                <span>{ticket.submittedAt}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Stepper Panel */}
      <div className="pl-2 flex flex-col justify-between">
        {selectedTicket ? (
          <>
            <div>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-slate-850 dark:text-slate-200 text-sm">Resolution Pipeline Trace</h4>
                <span className="font-mono text-[10px] text-slate-400">ID: {selectedTicket.id}</span>
              </div>
              <p className="text-xs text-slate-500 mb-4 bg-slate-50 dark:bg-slate-900 border border-slate-200/50 dark:border-slate-800 p-2.5 rounded-lg">
                <strong>Complaint:</strong> {selectedTicket.title}
              </p>

              {/* Vertical Stepper */}
              <div className="flex flex-col gap-5 pl-3 relative before:content-[''] before:absolute before:top-2 before:left-[7px] before:bottom-2 before:w-[2px] before:bg-slate-200 dark:before:bg-slate-850">
                {stages.map((stage, idx) => {
                  const isCompleted = idx < selectedTicket.stage;
                  const isActive = idx === selectedTicket.stage;
                  
                  return (
                    <div key={idx} className="flex gap-4 items-start relative">
                      <div className={`w-[16px] h-[16px] rounded-full border-2 z-10 flex items-center justify-center ${
                        isCompleted 
                          ? 'border-emerald-500 bg-emerald-500 text-white' 
                          : isActive 
                          ? 'border-blue-500 bg-white dark:bg-slate-900' 
                          : 'border-slate-300 bg-white dark:bg-slate-900'
                      }`}>
                        {isCompleted && <span className="text-[9px] font-bold">✓</span>}
                        {isActive && <div className="w-[6px] h-[6px] rounded-full bg-blue-500 animate-ping"></div>}
                      </div>
                      
                      <div className="flex-1">
                        <h5 className={`text-xs font-bold ${
                          isActive ? 'text-blue-600' : isCompleted ? 'text-slate-700 dark:text-slate-300' : 'text-slate-400'
                        }`}>
                          {stage.name}
                        </h5>
                        <p className="text-[10px] text-slate-400 mt-0.5">{stage.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800/80 pt-3 mt-4 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Assigned Officer</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">{selectedTicket.officer || 'Awaiting Routing'}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold uppercase block">Routed Department</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 mt-0.5 block">{selectedTicket.department}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 text-xs py-12 text-center">
            <FileText className="w-10 h-10 mb-2 opacity-50" />
            <span className="font-semibold">No active tickets in the pipeline</span>
            <span className="text-slate-400 mt-1">Submit a civic complaint above to see it tracked here</span>
          </div>
        )}
      </div>
    </div>
  );
}
