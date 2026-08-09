import React, { useState, useEffect } from 'react';
import StaffHeader from './StaffHeader';
import ComplaintsTable from './ComplaintsTable';
import DepartmentControlPanel from './DepartmentControlPanel';
import { RefreshCw, Inbox } from 'lucide-react';

/**
 * StaffPortal — restricted view for DEPT_HEAD role.
 *
 * What this shows (per spec):
 *   - StaffHeader (dept name, logout)
 *   - Ticket list filtered to this dept only (server-side RLS guarantees this)
 *   - DepartmentControlPanel with isStaffView=true (hides Priority + Re-route)
 *
 * What is intentionally ABSENT:
 *   - Metric cards (admin-only analytics)
 *   - Department filter tabs / "All Departments"
 *   - Broadcast / Announcement composer
 *   - "Add Dept Head" button
 *   - Modify Priority control
 *   - Global department dropdown
 *
 * Server-side enforcement:
 *   - GET /api/v1/complaints/ with DEPT_HEAD token returns ONLY that dept's
 *     complaints (enforced in ComplaintCreateListView.get_queryset)
 *   - PATCH /api/v1/complaints/<id>/status/ with DEPT_HEAD token returns 403
 *     if complaint.assigned_department != request.user.department
 */
export default function StaffPortal({ token, user, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [lastSynced, setLastSynced] = useState(null);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Map raw API item to the shape ComplaintsTable + DepartmentControlPanel expect
  const mapItem = (item) => {
    const now      = new Date();
    const deadline = item.sla_deadline_at ? new Date(item.sla_deadline_at) : now;
    const diffHours = Math.round((deadline - now) / (1000 * 3600));

    const deptCode = (item.assigned_department_code || '')
      || (item.assigned_department_name || '').toUpperCase().split(' ')[0]
      || 'DEPT';

    return {
      id:            item.ticket_id || item.id,
      db_id:         item.id,
      category:      item.category  || item.title || 'General',
      description:   item.description || '',
      assignedDept:  deptCode,
      assignedDeptId: item.assigned_department,
      priority:      (item.priority || 'MEDIUM').toUpperCase(),
      status:        item.status    || 'Submitted',
      slaHoursLeft:  diffHours,
      isSlaOverdue:  Boolean(item.is_sla_breached) || diffHours < 0,
      studentName:   item.is_anonymous ? 'Anonymous' : (item.student_name || 'Student'),
      studentRoll:   '2026-STU',
      routingReasoning: item.ai_routing_reasoning || 'AI routing engine processed ticket.',
      proofs:        item.resolution_proof_url ? [{ fileName: item.resolution_proof_url }] : [],
      adminComments: (item.history || []).map(h => ({
        author:    h.changed_by_name || 'System',
        text:      h.remarks         || `${h.old_status} → ${h.new_status}`,
        timestamp: h.timestamp
          ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Recently',
      })),
    };
  };

  // Fetch complaints (server already filters by dept for DEPT_HEAD token)
  const syncData = async (showLoader = false) => {
    if (showLoader) setLoading(true);
    try {
      const activeTok = token || localStorage.getItem('access_token') || localStorage.getItem('token');
      const res = await fetch('/api/v1/complaints/', {
        headers: { 'Authorization': `Bearer ${activeTok}` },
      });
      if (res.status === 401) {
        // Token expired — force re-login
        onLogout();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map(mapItem);
        setComplaints(mapped);
        setLastSynced(new Date());
      }
    } catch (err) {
      console.warn('StaffPortal: fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + 5-second auto-refresh
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const poll = async () => {
      if (!isMounted || isFetching) return;
      isFetching = true;
      await syncData();
      isFetching = false;
    };

    poll();
    const interval = setInterval(poll, 5000);
    const handleFocus = () => poll();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [token]);

  // Handle status update — API-first, same as Admin Dashboard
  const handleUpdateComplaint = async (updated) => {
    try {
      const activeTok = token || localStorage.getItem('access_token') || localStorage.getItem('token');
      const body = { status: updated.status };
      if (updated.resolution_proof_url) body.resolution_proof_url = updated.resolution_proof_url;
      if (updated.resolution_notes)    body.resolution_notes    = updated.resolution_notes;

      const res = await fetch(`/api/v1/complaints/${updated.db_id || updated.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type':  'application/json',
          'Authorization': `Bearer ${activeTok}`,
        },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedComplaint?.id === updated.id) setSelectedComplaint(updated);
        return { success: true };
      } else {
        let errMsg = `Server rejected transition (HTTP ${res.status}).`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errData.detail || errData.message || JSON.stringify(errData);
        } catch (_) {}
        return { success: false, error: errMsg };
      }
    } catch (err) {
      return { success: false, error: 'Network error — could not reach server.' };
    }
  };

  // Client-side search on already-filtered (by server) list
  const filteredComplaints = complaints.filter(item => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q)
    );
  });

  const deptName = user?.department_name || 'Department';

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">

      <StaffHeader user={user} onLogout={onLogout} />

      <main className="flex-1 w-full max-w-[1600px] mx-auto pb-12">

        {/* Page title bar */}
        <div className="px-6 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900 m-0">
              {deptName} Department — Assigned Tickets
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Showing only complaints routed to your department.
              {lastSynced && (
                <span className="ml-2 text-slate-400">
                  Last synced {lastSynced.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              )}
            </p>
          </div>

          {/* Search + manual refresh */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search tickets…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white w-52"
            />
            <button
              id="staff-refresh-btn"
              onClick={() => syncData(true)}
              disabled={loading}
              title="Refresh"
              className="p-2 bg-white border border-slate-200 rounded-lg text-slate-500 hover:text-slate-800 transition cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Split-screen layout: Table + Control Panel */}
        <div className="px-6 py-4 flex flex-col lg:flex-row gap-6 items-start">

          {/* Complaints Table */}
          <div className={`transition-all duration-300 w-full ${selectedComplaint ? 'lg:w-2/3' : 'lg:w-full'}`}>
            {loading && complaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-slate-400">
                <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
                <p className="text-sm font-medium">Loading your department's tickets…</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-12 flex flex-col items-center gap-3 text-slate-400">
                <Inbox className="w-10 h-10" />
                <p className="text-sm font-medium">No tickets assigned to your department.</p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-emerald-600 underline cursor-pointer"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              <ComplaintsTable
                complaints={filteredComplaints}
                selectedComplaintId={selectedComplaint?.id || null}
                onSelectComplaint={(complaint) => {
                  if (selectedComplaint?.id === complaint.id) {
                    setSelectedComplaint(null);
                  } else {
                    setSelectedComplaint(complaint);
                  }
                }}
              />
            )}
          </div>

          {/* Department Control Panel — staff-restricted */}
          {selectedComplaint && (
            <div className="w-full lg:w-1/3">
              <DepartmentControlPanel
                complaint={selectedComplaint}
                onClose={() => setSelectedComplaint(null)}
                onUpdateComplaint={handleUpdateComplaint}
                isStaffView={true}
              />
            </div>
          )}

        </div>
      </main>

      <footer className="bg-slate-900 text-slate-500 py-4 border-t border-slate-800 text-center text-xs">
        <p>© 2026 CMSCE Department Portal — {deptName}</p>
      </footer>
    </div>
  );
}
