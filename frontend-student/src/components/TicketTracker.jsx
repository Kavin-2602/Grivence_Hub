import React, { useState, useEffect } from 'react';
import { Clock, ShieldAlert, CheckCircle, CheckCircle2, ArrowLeft, RefreshCw } from 'lucide-react';
import FeedbackCard from './FeedbackCard';

export default function TicketTracker({ ticketId = "CMP-1042", onBack }) {
  const [complaint, setComplaint] = useState(null);
  const [timeLeft, setTimeLeft] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [loading, setLoading] = useState(false);

  // Fetch real data from API
  const fetchTrackerData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch(`http://127.0.0.1:8000/api/v1/complaints/track/${ticketId}/`, {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setComplaint(data);
      }
    } catch (err) {
      console.warn('API track offline');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrackerData();
  }, [ticketId]);

  // Live SLA Countdown decrement
  useEffect(() => {
    if (!complaint?.sla_deadline_at) return;
    const timer = setInterval(() => {
      const target = new Date(complaint.sla_deadline_at).getTime();
      const now = new Date().getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      } else {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ hours, minutes, seconds });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [complaint?.sla_deadline_at]);

  // Full 6-stage stepper — matches the actual workflow state machine
  const stages = [
    { key: 'Submitted',                       label: '1. Submitted' },
    { key: 'AI Analysed',                     label: '2. AI Analysed' },
    { key: 'Assigned',                        label: '3. Assigned' },
    { key: 'In Progress',                     label: '4. In Progress' },
    { key: 'Resolution Pending Verification', label: '5. Pending Verify' },
    { key: 'Resolved',                        label: '6. Resolved' },
  ];

  const getStageIndex = (status) => {
    switch (status) {
      case 'Submitted':                       return 0;
      case 'AI Analysed':                     return 1;
      case 'Assigned':                        return 2;
      case 'In Progress':                     return 3;
      case 'Resolution Pending Verification': return 4;
      case 'Resolved':                        return 5;
      case 'Reopened':                        return 3;
      case 'Closed':                          return 5;
      default:                                return 1;
    }
  };

  if (!complaint) {
    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 flex flex-col items-center justify-center gap-4 min-h-[40vh]">
        <button
          onClick={onBack}
          className="self-start flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Desk
        </button>
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          <p className="text-sm font-medium">Loading ticket {ticketId}...</p>
        </div>
      </div>
    );
  }

  const currentStep = getStageIndex(complaint.status);
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';

  const confidenceScore = complaint.ai_confidence_score || complaint.confidence_score || 97;
  const displayScore = Math.round(confidenceScore > 1 ? confidenceScore : confidenceScore * 100);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">

      {/* Top Bar — no fake toggle, only Back and Refresh */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 px-3 py-2 rounded-xl shadow-sm transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Desk
        </button>

        <button
          onClick={fetchTrackerData}
          disabled={loading}
          className="p-2 bg-white border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
          title="Refresh Status"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Ticket Tracker Header */}
      <div className="bg-white rounded-2xl p-6 shadow-xl border border-slate-100 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm font-black text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                Ticket #{complaint.ticket_id}
              </span>
              <span className="px-2.5 py-1 bg-rose-600 text-white text-xs font-black rounded-full uppercase tracking-wider">
                {complaint.priority} Priority
              </span>
              <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-full border border-blue-100">
                {complaint.status}
              </span>
            </div>
            <h1 className="text-xl font-black text-slate-900 mt-2">
              "{complaint.title}"
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Category: {complaint.category} • Department: {complaint.assigned_department_name || 'Pending Assignment'}
            </p>
          </div>

          {/* Real-time Live SLA Countdown */}
          <div className="bg-slate-900 text-white p-4 rounded-xl shadow-lg border border-slate-800 min-w-[200px] text-center">
            <div className="flex items-center justify-center gap-1.5 text-xs text-amber-400 font-bold uppercase tracking-wider mb-1">
              <Clock className="w-4 h-4 animate-pulse" /> Live SLA Countdown
            </div>
            <div className="font-mono text-2xl font-black text-white">
              {String(timeLeft.hours).padStart(2, '0')}:{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
            </div>
            <span className="text-[10px] text-slate-400 block mt-0.5">SLA Deadline Window</span>
          </div>
        </div>

        {/* 6-Stage Lifecycle Stepper */}
        <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Lifecycle Progression Stepper</h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6">
          {stages.map((stage, idx) => {
            const isCompleted = idx <= currentStep;
            const isCurrent = idx === currentStep;

            return (
              <div
                key={stage.key}
                className={`p-3 rounded-xl border text-center transition flex flex-col items-center justify-center gap-1 ${
                  isCurrent
                    ? 'bg-emerald-600 text-white font-black shadow-md border-emerald-700 ring-2 ring-emerald-300'
                    : isCompleted
                    ? 'bg-emerald-50 text-emerald-800 font-bold border-emerald-200'
                    : 'bg-slate-50 text-slate-400 border-slate-200'
                }`}
              >
                <span className="text-[11px] font-extrabold leading-tight">{stage.label}</span>
                {isCompleted && (
                  <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${isCurrent ? 'text-white' : 'text-emerald-600'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* AI Routing Reasoning Notice */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-900 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-extrabold block text-emerald-950">AI Routing Decision ({displayScore}% Match):</span>
            <p className="mt-0.5">{complaint.ai_routing_reasoning || 'AI routing engine processed ticket.'}</p>
          </div>
        </div>
      </div>

      {/* History Log */}
      {complaint.history && complaint.history.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow border border-slate-100 mb-6">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-4">Audit History</h3>
          <div className="space-y-2">
            {complaint.history.map((h, idx) => (
              <div key={idx} className="flex items-start gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800">{h.old_status} → {h.new_status}</span>
                  {h.remarks && <p className="text-slate-500 mt-0.5">{h.remarks}</p>}
                  {h.timestamp && <p className="text-slate-400 text-[10px] mt-0.5">{new Date(h.timestamp).toLocaleString()}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Feedback Component — keyed by ticket_id to force full remount on ticket change */}
      <FeedbackCard
        key={complaint.ticket_id}
        complaintId={complaint.id}
        ticketId={complaint.ticket_id}
        isLocked={!isResolved}
        existingFeedback={complaint.feedback}
      />

    </div>
  );
}
