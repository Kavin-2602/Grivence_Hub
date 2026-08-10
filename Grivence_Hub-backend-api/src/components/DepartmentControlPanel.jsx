import React, { useState, useEffect } from 'react';
import { X, Send, Award, ArrowRightLeft, FileText, CheckCircle2, AlertCircle, ChevronRight, Loader2 } from 'lucide-react';

// ── Workflow state machine (mirrors workflow_service.py exactly) ──────────────
const VALID_TRANSITIONS = {
  'Submitted':                       ['AI Analysed'],
  'AI Analysed':                     ['Assigned'],
  'Assigned':                        ['In Progress'],
  'In Progress':                     ['Resolution Pending Verification', 'Resolved'],
  'Resolution Pending Verification': ['Resolved', 'Reopened'],
  'Resolved':                        ['Closed', 'Reopened'],
  'Reopened':                        ['In Progress', 'Assigned'],
  'Closed':                          [],
};

// Transitions that require proof URL + resolution notes
const REQUIRES_PROOF = new Set(['Resolution Pending Verification', 'Resolved']);

const STATUS_STYLES = {
  'Submitted':                       'bg-slate-100 text-slate-700 border-slate-300',
  'AI Analysed':                     'bg-indigo-100 text-indigo-800 border-indigo-300',
  'Assigned':                        'bg-blue-100 text-blue-800 border-blue-300',
  'In Progress':                     'bg-amber-100 text-amber-800 border-amber-300',
  'Resolution Pending Verification': 'bg-orange-100 text-orange-800 border-orange-300',
  'Resolved':                        'bg-emerald-100 text-emerald-800 border-emerald-300',
  'Closed':                          'bg-slate-200 text-slate-600 border-slate-400',
  'Reopened':                        'bg-rose-100 text-rose-800 border-rose-300',
};

export default function DepartmentControlPanel({
  complaint,
  onClose,
  onUpdateComplaint,
  isStaffView = false,
}) {
  const [comment, setComment] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Fields for proof-required transitions
  const [pendingStatus, setPendingStatus] = useState(null);
  const [proofUrl, setProofUrl]         = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // UI state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [apiError, setApiError]         = useState('');
  const [apiSuccess, setApiSuccess]     = useState('');

  // Sync state when complaint changes
  useEffect(() => {
    if (complaint) {
      setSelectedDept(complaint.assignedDept || '');
      setComment('');
      setPendingStatus(null);
      setProofUrl('');
      setResolutionNotes('');
      setApiError('');
      setApiSuccess('');
    }
  }, [complaint?.id]);

  // Early return after all hooks
  if (!complaint) return null;

  const departments = [
    { code: 'CANTEEN',      label: 'Canteen' },
    { code: 'TRANSPORT',    label: 'Transport' },
    { code: 'HOSTEL',       label: 'Hostel' },
    { code: 'SPORTS',       label: 'Sports' },
    { code: 'ACADEMIC',     label: 'Academic' },
    { code: 'HOSPITALITY',  label: 'Hospitality' },
  ];

  // ── Transition Handlers ────────────────────────────────────────────────────

  const initiateTransition = (newStatus) => {
    setApiError('');
    setApiSuccess('');
    if (REQUIRES_PROOF.has(newStatus)) {
      // Show the proof/notes form first — don't call API yet
      setPendingStatus(newStatus);
      setProofUrl('');
      setResolutionNotes('');
    } else {
      // No proof needed — call API immediately
      executeTransition(newStatus, null, null);
    }
  };

  const executeTransition = async (newStatus, proof, notes) => {
    setIsTransitioning(true);
    setApiError('');
    setApiSuccess('');

    const updatedComplaint = {
      ...complaint,
      status: newStatus,
      ...(proof ? { resolution_proof_url: proof } : {}),
      ...(notes ? { resolution_notes: notes }     : {}),
    };

    const result = await onUpdateComplaint(updatedComplaint);

    setIsTransitioning(false);

    if (result?.success) {
      setApiSuccess(`✓ Status updated to "${newStatus}" successfully.`);
      setPendingStatus(null);
      setProofUrl('');
      setResolutionNotes('');
    } else {
      // Surface the server's 400/500 error message
      setApiError(result?.error || 'Transition failed. Check server logs.');
    }
  };

  const handleProofSubmit = (e) => {
    e.preventDefault();
    if (!proofUrl.trim()) {
      setApiError('Resolution proof URL is required.');
      return;
    }
    if (!resolutionNotes.trim()) {
      setApiError('Resolution notes are required.');
      return;
    }
    executeTransition(pendingStatus, proofUrl.trim(), resolutionNotes.trim());
  };

  const cancelProofForm = () => {
    setPendingStatus(null);
    setProofUrl('');
    setResolutionNotes('');
    setApiError('');
  };

  // ── Comment Handler ────────────────────────────────────────────────────────

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;

    const updatedComments = [...(complaint.adminComments || []), {
      author: 'Administrator',
      text: comment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];

    onUpdateComplaint({ ...complaint, adminComments: updatedComments });
    setComment('');
  };

  const handleReRoute = (newDept) => {
    setSelectedDept(newDept);
    onUpdateComplaint({
      ...complaint,
      assignedDept: newDept,
      routingReasoning: `Manually re-routed by Admin to ${departments.find(d => d.code === newDept)?.label || newDept}.`
    });
  };

  // ── Computed Values ────────────────────────────────────────────────────────

  const validNextStatuses = VALID_TRANSITIONS[complaint.status] || [];
  const statusStyle = STATUS_STYLES[complaint.status] || 'bg-slate-100 text-slate-700 border-slate-300';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-[calc(100vh-220px)] sticky top-28 overflow-hidden animate-in slide-in-from-right duration-300">

      {/* Panel Header */}
      <div className="p-4 bg-brand-green text-white flex justify-between items-center flex-shrink-0">
        <div>
          <h3 className="font-bold text-sm text-white m-0">Department Control Panel</h3>
          <p className="text-[10px] text-brand-yellow font-medium m-0">Manage routing, approvals, and reviews</p>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-emerald-800 rounded-md transition-colors cursor-pointer text-white"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panel Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">

        {/* Ticket Summary */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-xs text-slate-500 font-bold">{complaint.id}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusStyle}`}>
              {complaint.status}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm leading-tight">{complaint.category}</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{complaint.description}</p>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold">Student: {complaint.studentName}</p>
        </div>

        {/* API Feedback Banners */}
        {apiError && (
          <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 font-medium">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5 text-rose-500" />
            <span>{apiError}</span>
          </div>
        )}
        {apiSuccess && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-emerald-600" />
            <span>{apiSuccess}</span>
          </div>
        )}

        {/* AI Routing Reasoning */}
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-lg p-3">
          <h5 className="text-[11px] font-bold text-indigo-900 uppercase tracking-wide flex items-center gap-1.5 mb-1.5">
            <Award className="h-3.5 w-3.5 text-indigo-700" />
            AI Routing Reasoning
          </h5>
          <p className="text-xs text-indigo-800 leading-relaxed bg-white/70 p-2.5 rounded border border-indigo-50/50 font-medium">
            {complaint.routingReasoning || 'AI Classifier is analyzing the keywords...'}
          </p>
        </div>

        {/* Proof Attachments */}
        <div className="border border-slate-150 rounded-lg p-3">
          <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-2">
            <FileText className="h-3.5 w-3.5 text-slate-500" />
            Proof Attachments
          </h5>
          {complaint.proofs && complaint.proofs.length > 0 ? (
            <div className="space-y-1.5">
              {complaint.proofs.map((proof, idx) => (
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-xs">
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{proof.fileName}</span>
                  <a
                    href={proof.fileName}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-green font-bold hover:underline"
                  >
                    View File
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400 italic">No attachments submitted by student.</p>
          )}
        </div>

        {/* ── Workflow Status Transitions ──────────────────────────────────── */}
        <div className="border border-slate-150 rounded-lg p-3 space-y-3">
          <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
            Workflow Actions
          </h5>

          {validNextStatuses.length === 0 ? (
            <p className="text-xs text-slate-400 italic">
              No further transitions available. Status is <strong>{complaint.status}</strong>.
            </p>
          ) : (
            <>
              <p className="text-[10px] text-slate-400 font-semibold uppercase">
                Valid Next Step(s) from <span className="text-slate-600">"{complaint.status}"</span>:
              </p>

              {/* Pending proof/notes form */}
              {pendingStatus ? (
                <form onSubmit={handleProofSubmit} className="space-y-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-[11px] font-bold text-amber-900 uppercase tracking-wide">
                    Transition to "{pendingStatus}" — Required Fields
                  </p>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Resolution Proof URL <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="url"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://drive.google.com/proof-file"
                      required
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 uppercase mb-1">
                      Resolution Notes <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Describe what action was taken to resolve the complaint..."
                      rows="3"
                      required
                      className="w-full bg-white border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-slate-700"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={isTransitioning}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold rounded transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isTransitioning ? (
                        <><Loader2 className="h-3 w-3 animate-spin" /> Saving...</>
                      ) : (
                        <><ChevronRight className="h-3 w-3" /> Confirm → {pendingStatus}</>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={cancelProofForm}
                      disabled={isTransitioning}
                      className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                // Show buttons for each valid next status
                <div className="grid grid-cols-1 gap-1.5">
                  {validNextStatuses.map((nextStatus) => (
                    <button
                      key={nextStatus}
                      onClick={() => initiateTransition(nextStatus)}
                      disabled={isTransitioning}
                      className={`w-full text-left flex items-center justify-between px-3 py-2 rounded border text-[11px] font-bold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                        STATUS_STYLES[nextStatus] || 'bg-slate-50 text-slate-700 border-slate-200'
                      } hover:brightness-95`}
                    >
                      <span>→ {nextStatus}</span>
                      {REQUIRES_PROOF.has(nextStatus) && (
                        <span className="text-[9px] font-semibold text-slate-500 bg-white/50 px-1.5 py-0.5 rounded border border-current/20 ml-2 flex-shrink-0">
                          Requires Proof
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Quick Priority buttons — Admin only, hidden in Staff View */}
        {!isStaffView && (
          <div className="border border-slate-150 rounded-lg p-3 space-y-2">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Modify Priority</label>
            <div className="flex gap-1.5">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((pr) => (
                <button
                  key={pr}
                  onClick={() => onUpdateComplaint({ ...complaint, priority: pr })}
                  className={`flex-1 text-[10px] font-bold py-1 rounded transition-colors cursor-pointer ${
                    complaint.priority === pr
                      ? 'bg-slate-900 text-white border border-slate-900'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {pr}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Re-route Department Dropdown — Admin only, hidden in Staff View */}
        {!isStaffView && (
          <div className="border border-slate-150 rounded-lg p-3 space-y-2">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3" /> Re-route Department
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-slate-700 transition-all cursor-pointer font-medium"
              value={selectedDept}
              onChange={(e) => handleReRoute(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>{dept.label}</option>
              ))}
            </select>
          </div>
        )}

        {/* Admin Activity Log & Comment form */}
        <div className="border border-slate-150 rounded-lg p-3 space-y-3">
          <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            Admin Activity Log
          </h5>

          <div className="space-y-2 max-h-[140px] overflow-y-auto">
            {complaint.adminComments && complaint.adminComments.length > 0 ? (
              complaint.adminComments.map((c, i) => (
                <div key={i} className="bg-slate-50 p-2 rounded text-xs border border-slate-100">
                  <div className="flex justify-between text-[10px] text-slate-400 font-semibold mb-0.5">
                    <span>{c.author}</span>
                    <span>{c.timestamp}</span>
                  </div>
                  <p className="text-slate-600 font-medium">{c.text}</p>
                </div>
              ))
            ) : (
              <p className="text-[11px] text-slate-400 italic">No notes or activities recorded.</p>
            )}
          </div>

          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              className="flex-1 bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-slate-800"
              placeholder="Add internal notes..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <button
              type="submit"
              className="bg-brand-green hover:bg-brand-green-hover text-white p-2 rounded cursor-pointer transition-colors"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
