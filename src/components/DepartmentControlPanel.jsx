import React, { useState, useEffect } from 'react';
import { X, Send, Award, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';

export default function DepartmentControlPanel({ 
  complaint, 
  onClose, 
  onUpdateComplaint 
}) {
  // Call hooks unconditionally at the top level
  const [comment, setComment] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  // Sync selected department when complaint changes
  useEffect(() => {
    if (complaint) {
      setSelectedDept(complaint.assignedDept);
      setComment('');
    }
  }, [complaint]);

  // Early return after hook calls
  if (!complaint) return null;

  const departments = [
    { code: 'CANTEEN', label: 'Canteen' },
    { code: 'TRANSPORT', label: 'Transport' },
    { code: 'HOSTEL', label: 'Hostel' },
    { code: 'SPORTS', label: 'Sports' },
    { code: 'ACADEMIC', label: 'Academic' },
    { code: 'HOSPITALITY', label: 'Hospitality' }
  ];

  // Save the comment
  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    const updatedComments = [...(complaint.adminComments || []), {
      author: 'Administrator',
      text: comment.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }];

    onUpdateComplaint({
      ...complaint,
      adminComments: updatedComments
    });
    setComment('');
  };

  // Re-route department action
  const handleReRoute = (newDept) => {
    setSelectedDept(newDept);
    onUpdateComplaint({
      ...complaint,
      assignedDept: newDept,
      routingReasoning: `Manually re-routed by Admin to ${departments.find(d => d.code === newDept)?.label || newDept}.`
    });
  };

  // Update status action
  const handleStatusChange = (newStatus) => {
    onUpdateComplaint({
      ...complaint,
      status: newStatus
    });
  };

  // Update priority action
  const handlePriorityChange = (newPriority) => {
    onUpdateComplaint({
      ...complaint,
      priority: newPriority
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-lg flex flex-col h-[calc(100vh-220px)] sticky top-28 overflow-hidden animate-in slide-in-from-right duration-300">
      
      {/* Panel Header */}
      <div className="p-4 bg-brand-green text-white flex justify-between items-center">
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
        
        {/* Ticket Header Details */}
        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
          <div className="flex justify-between items-center mb-1">
            <span className="font-mono text-xs text-slate-500 font-bold">{complaint.id}</span>
            <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-semibold">
              {complaint.studentRoll}
            </span>
          </div>
          <h4 className="font-bold text-slate-800 text-sm leading-tight">{complaint.category}</h4>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">{complaint.description}</p>
          <p className="text-[10px] text-slate-400 mt-3 font-semibold">Student: {complaint.studentName}</p>
        </div>

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
                <div key={idx} className="flex items-center justify-between bg-slate-50 p-2 rounded border border-slate-100 text-xs hover:bg-slate-100 transition-colors">
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">{proof.fileName}</span>
                  <a 
                    href="#download"
                    onClick={(e) => { e.preventDefault(); alert(`Downloading file: ${proof.fileName}`); }}
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

        {/* Approval & Management Actions */}
        <div className="border border-slate-150 rounded-lg p-3 space-y-3">
          <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5 mb-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-slate-500" />
            Control Actions
          </h5>
          
          {/* Quick Status buttons */}
          <div className="space-y-2">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Update Status</label>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                onClick={() => handleStatusChange('In Progress')}
                disabled={complaint.status === 'In Progress'}
                className="bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed border border-blue-200 text-[11px] font-bold py-1.5 px-2 rounded transition-colors cursor-pointer"
              >
                In Progress
              </button>
              <button
                onClick={() => handleStatusChange('Resolution Pending Verification')}
                disabled={complaint.status === 'Resolution Pending Verification'}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-200 text-[11px] font-bold py-1.5 px-2 rounded transition-colors cursor-pointer"
              >
                Pending Verification
              </button>
              <button
                onClick={() => handleStatusChange('Resolved')}
                disabled={complaint.status === 'Resolved'}
                className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-200 text-[11px] font-bold py-1.5 px-2 rounded transition-colors cursor-pointer col-span-2"
              >
                Resolve Complaint
              </button>
            </div>
          </div>

          {/* Quick Priority buttons */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase">Modify Priority</label>
            <div className="flex gap-1.5">
              {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((pr) => (
                <button
                  key={pr}
                  onClick={() => handlePriorityChange(pr)}
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

          {/* Re-route Department Dropdown */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="block text-[10px] font-semibold text-slate-400 uppercase flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3" /> Re-route Department
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded px-2.5 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand-green text-slate-700 transition-all cursor-pointer font-medium"
              value={selectedDept}
              onChange={(e) => handleReRoute(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code}>
                  {dept.label}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Admin Comments log & add */}
        <div className="border border-slate-150 rounded-lg p-3 space-y-3">
          <h5 className="text-[11px] font-bold text-slate-600 uppercase tracking-wide flex items-center gap-1.5">
            Admin Activity Log
          </h5>
          
          {/* Comment list */}
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

          {/* Comment Form */}
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
