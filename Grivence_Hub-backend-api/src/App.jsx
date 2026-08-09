import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import DepartmentTabs from './components/DepartmentTabs';
import ComplaintsTable from './components/ComplaintsTable';
import DepartmentControlPanel from './components/DepartmentControlPanel';
import NotificationsPanel from './components/NotificationsPanel';
import AddDepartmentHeadModal from './components/AddDepartmentHeadModal';
import BroadcastSystem from './components/BroadcastSystem';
import LoginScreen from './components/LoginScreen';
import StaffPortal from './components/StaffPortal';

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('access_token') || localStorage.getItem('token'));
  const [user,  setUser]  = useState(() => {
    try { return JSON.parse(localStorage.getItem('user') || 'null'); }
    catch (_) { return null; }
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState([]);

  // Filters & Drawer State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Modals & Sliders Visibility
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddDeptHeadOpen, setIsAddDeptHeadOpen] = useState(false);

  const mapDeptCode = (code, name) => {
    if (code) return code.toUpperCase();
    if (!name) return 'CANTEEN';
    const upperName = name.toUpperCase();
    if (upperName.includes('TRANSPORT')) return 'TRANSPORT';
    if (upperName.includes('CANTEEN') || upperName.includes('FOOD')) return 'CANTEEN';
    if (upperName.includes('HOSTEL')) return 'HOSTEL';
    if (upperName.includes('SPORTS')) return 'SPORTS';
    if (upperName.includes('ACADEMIC')) return 'ACADEMIC';
    if (upperName.includes('HOSPITALITY')) return 'HOSPITALITY';
    return 'CANTEEN';
  };

  const handleSelectDepartment = (dept) => {
    setSelectedDepartment(dept);
    setActiveTab(dept);
  };

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    if (tab !== 'ANNOUNCEMENTS') {
      setSelectedDepartment(tab);
    }
  };

  // Unified Data Sync Effect with isFetching concurrency guard
  useEffect(() => {
    let isMounted = true;
    let isFetching = false;

    const syncData = async () => {
      if (isFetching) return;
      isFetching = true;

      try {
        let activeTok = localStorage.getItem('access_token') || localStorage.getItem('token');

        // No token — LoginScreen will handle authentication; don't auto-login
        if (!activeTok) {
          if (isMounted) setLoading(false);
          return;
        }

        let res;
        try {
          res = await fetch('/api/v1/complaints/', {
            headers: { 'Authorization': `Bearer ${activeTok}` }
          });
        } catch (fetchErr) {
          console.warn('Fetch complaints error:', fetchErr);
          return;
        }

        // 401 = token expired, force re-login
        if (res.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          if (isMounted) { setToken(null); setUser(null); }
          return;
        }

          if (res && res.ok) {
            const data = await res.json();
            const mapped = data.map(item => {
              const now = new Date();
              const deadline = item.sla_deadline_at ? new Date(item.sla_deadline_at) : now;
              const diffHours = Math.round((deadline - now) / (1000 * 3600));

              return {
                id: item.ticket_id || item.id,
                db_id: item.id,
                category: item.category || item.title || 'General',
                description: item.description || '',
                assignedDept: mapDeptCode(item.assigned_department_code, item.assigned_department_name),
                priority: (item.priority || 'MEDIUM').toUpperCase(),
                status: item.status || 'Submitted',
                slaHoursLeft: diffHours,
                isSlaOverdue: Boolean(item.is_sla_breached) || diffHours < 0,
                studentName: item.student_name || 'Student User',
                studentRoll: '2026-STU',
                routingReasoning: item.ai_routing_reasoning || 'AI routing engine processed ticket.',
                proofs: item.resolution_proof_url ? [{ fileName: item.resolution_proof_url }] : [],
                adminComments: (item.history || []).map(h => ({
                  author: h.changed_by_name || 'System AI',
                  text: h.remarks || `${h.old_status} -> ${h.new_status}`,
                  timestamp: h.timestamp ? new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recently'
                }))
              };
            });
            if (isMounted) {
              setComplaints(mapped);
              setLoading(false);
            }
          }
      } finally {
        isFetching = false;
      }
    };

    syncData();
    const interval = setInterval(syncData, 5000);
    const handleFocus = () => syncData();
    window.addEventListener('focus', handleFocus);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleUpdateComplaint = async (updated) => {
    // API-first: do NOT optimistically update state before the server confirms
    try {
      const activeTok = token || localStorage.getItem('access_token') || localStorage.getItem('token');
      const body = {
        status: updated.status,
      };
      if (updated.resolution_proof_url) body.resolution_proof_url = updated.resolution_proof_url;
      if (updated.resolution_notes)    body.resolution_notes    = updated.resolution_notes;

      const res = await fetch(`/api/v1/complaints/${updated.db_id || updated.id}/status/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': activeTok ? `Bearer ${activeTok}` : ''
        },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        // Only update local state after server confirms the transition
        setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
        if (selectedComplaint && selectedComplaint.id === updated.id) {
          setSelectedComplaint(updated);
        }
        return { success: true };
      } else {
        // Surface the API error message back to the caller
        let errMsg = `Server rejected transition (HTTP ${res.status}).`;
        try {
          const errData = await res.json();
          if (errData.error) errMsg = errData.error;
          else if (errData.detail) errMsg = errData.detail;
          else if (errData.message) errMsg = errData.message;
          else errMsg = JSON.stringify(errData);
        } catch (_) {}
        return { success: false, error: errMsg };
      }
    } catch (err) {
      console.warn('API status patch error:', err);
      return { success: false, error: 'Network error — could not reach server.' };
    }
  };

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    setComplaints([]);
    setSelectedComplaint(null);
  };

  const handleAddDeptHead = async (data) => {
    try {
      const res = await fetch('/api/v1/admin/staff/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: data.fullName,
          email: data.emailId,
          department: data.department
        })
      });
      const responseData = await res.json();
      if (res.ok) {
        alert(`Successfully added ${responseData.user.full_name} as Department Head! Temporary Password: ${responseData.temporary_password}`);
      } else {
        alert(`Failed to add staff: ${responseData.error || 'Unknown error'}`);
      }
    } catch (err) {
      alert('Network error while adding staff member.');
    }
  };

  const handlePublishAnnouncement = (announcement) => {
    setPublishedAnnouncements(prev => [announcement, ...prev]);
  };

  const handleDeleteAnnouncement = (id) => {
    setPublishedAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Filter complaints based on Search, Dropdown Filter, and Active Tab
  const filteredComplaints = complaints.filter(item => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = 
      !query ||
      item.id.toLowerCase().includes(query) ||
      item.category.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query) ||
      item.studentRoll.toLowerCase().includes(query);

    const activeDeptFilter = selectedDepartment !== 'ALL' ? selectedDepartment : activeTab;

    const matchesDept = 
      activeDeptFilter === 'ALL' || 
      item.assignedDept === activeDeptFilter;

    return matchesSearch && matchesDept;
  });

  // ── Role-gated rendering ────────────────────────────────────────────────
  // Enforce strict routing based on the user object
  if (!token || !user) {
    if (token && !user) {
      // Clear stale token if user object is missing
      localStorage.removeItem('access_token');
      localStorage.removeItem('token');
    }
    return <LoginScreen onLoginSuccess={handleLogin} />;
  }

  // Handle URL parameters for explicit intent
  const urlParams = new URLSearchParams(window.location.search);
  const isStaffUrl = urlParams.get('type') === 'staff';
  const isAdminUrl = urlParams.get('type') === 'admin';

  // Strict check for DEPT_HEAD
  if (user.role === 'DEPT_HEAD') {
    if (isAdminUrl) {
      // Trying to access Admin portal as Dept Head
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-6 rounded shadow max-w-sm text-center">
            <h2 className="text-xl font-bold text-rose-600 mb-2">Access Denied</h2>
            <p className="text-sm text-slate-600 mb-4">You are logged in as a Department Head. You cannot access the Admin Dashboard.</p>
            <button onClick={handleLogout} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">Logout to switch accounts</button>
          </div>
        </div>
      );
    }
    return <StaffPortal token={token} user={user} onLogout={handleLogout} />;
  }

  // Strict check for ADMIN
  if (user.role === 'ADMIN') {
    if (isStaffUrl) {
      // Trying to access Staff portal as Admin
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
          <div className="bg-white p-6 rounded shadow max-w-sm text-center">
            <h2 className="text-xl font-bold text-rose-600 mb-2">Access Denied</h2>
            <p className="text-sm text-slate-600 mb-4">You are logged in as an Admin. You cannot access the Department Staff Portal.</p>
            <button onClick={handleLogout} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">Logout to switch accounts</button>
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={handleSelectDepartment}
        onBellClick={() => setIsNotificationsOpen(true)}
        unreadCount={notifications.filter(n => !n.isRead).length}
        onAddDeptHeadClick={() => setIsAddDeptHeadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto pb-12">
        {activeTab !== 'ANNOUNCEMENTS' ? (
          <>
            {/* KPI Cards Row */}
            <MetricCards token={token} />

            {/* Department Filter Tabs */}
            <DepartmentTabs activeTab={activeTab} setActiveTab={handleSelectTab} />

            {/* Split Screen layout: Table / Control Panel */}
            <div className="px-6 py-6 flex flex-col lg:flex-row gap-6 items-start">
              
              {/* Primary Table container */}
              <div className={`transition-all duration-300 w-full ${
                selectedComplaint ? 'lg:w-2/3' : 'lg:w-full'
              }`}>
                <ComplaintsTable
                  complaints={filteredComplaints}
                  selectedComplaintId={selectedComplaint?.id || null}
                  onSelectComplaint={(complaint) => {
                    if (selectedComplaint && selectedComplaint.id === complaint.id) {
                      setSelectedComplaint(null);
                    } else {
                      setSelectedComplaint(complaint);
                    }
                  }}
                />
              </div>

              {/* Department Control Panel */}
              {selectedComplaint && (
                <div className="w-full lg:w-1/3">
                  <DepartmentControlPanel
                    complaint={selectedComplaint}
                    onClose={() => setSelectedComplaint(null)}
                    onUpdateComplaint={handleUpdateComplaint}
                  />
                </div>
              )}

            </div>
          </>
        ) : (
          <>
            <DepartmentTabs activeTab={activeTab} setActiveTab={handleSelectTab} />
            <BroadcastSystem 
              onPublishAnnouncement={handlePublishAnnouncement}
              publishedAnnouncements={publishedAnnouncements}
              onDeleteAnnouncement={handleDeleteAnnouncement}
            />
          </>
        )}
      </main>

      {/* Modals & Overlays */}
      <NotificationsPanel
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
        onClearAll={handleClearNotifications}
      />

      <AddDepartmentHeadModal
        isOpen={isAddDeptHeadOpen}
        onClose={() => setIsAddDeptHeadOpen(false)}
        onSave={handleAddDeptHead}
      />

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-center text-xs mt-auto">
        <div className="max-w-[1600px] mx-auto px-6">
          <p>© 2026 CMSCE Admin Portal. All rights reserved.</p>
          <p className="mt-1 text-[10px] opacity-70">AI-Powered Routing Engine v1.2.0 • Secured under branch feature/admin-dashboard</p>
        </div>
      </footer>
    </div>
  );
  }

  // If role is neither DEPT_HEAD nor ADMIN
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="bg-white p-6 rounded shadow max-w-sm text-center">
        <h2 className="text-xl font-bold text-rose-600 mb-2">Access Denied</h2>
        <p className="text-sm text-slate-600 mb-4">You do not have permission to access this portal.</p>
        <button onClick={handleLogout} className="px-4 py-2 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700">Logout</button>
      </div>
    </div>
  );
}
