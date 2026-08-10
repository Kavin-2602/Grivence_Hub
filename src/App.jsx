import React, { useState } from 'react';
import Header from './components/Header';
import MetricCards from './components/MetricCards';
import DepartmentTabs from './components/DepartmentTabs';
import ComplaintsTable from './components/ComplaintsTable';
import DepartmentControlPanel from './components/DepartmentControlPanel';
import NotificationsPanel from './components/NotificationsPanel';
import AddDepartmentHeadModal from './components/AddDepartmentHeadModal';
import BroadcastSystem from './components/BroadcastSystem';

// Initial Mock Complaints Data
const initialComplaints = [
  {
    id: 'CMS-3921',
    category: 'Substandard Lunch Quality',
    description: 'Unfresh vegetables and undercooked rice served in afternoon mess lunch. Multiple students complained of stomach issues.',
    assignedDept: 'CANTEEN',
    priority: 'CRITICAL',
    status: 'In Progress',
    slaHoursLeft: -2,
    isSlaOverdue: true,
    studentName: 'Amit Verma',
    studentRoll: '2024-EE-45',
    routingReasoning: 'AI Routing Engine matched text keywords "mess lunch", "undercooked", and "vegetables" with label CANTEEN. (Confidence: 98.2%)',
    proofs: [{ fileName: 'mess_food_photo.jpg' }],
    adminComments: [
      { author: 'System AI', text: 'Auto-routed to Canteen Department.', timestamp: '10:00 AM' }
    ]
  },
  {
    id: 'CMS-3922',
    category: 'Route 4 College Bus Delay',
    description: 'College bus for Route 4 was delayed by 45 minutes without prior notice, making students miss early midterm exams.',
    assignedDept: 'TRANSPORT',
    priority: 'HIGH',
    status: 'AI Analysed',
    slaHoursLeft: 1.5,
    isSlaOverdue: false,
    studentName: 'Sneha Rao',
    studentRoll: '2023-CS-12',
    routingReasoning: 'AI Routing Engine matched keywords "College bus", "Route 4", and "delayed" with label TRANSPORT. (Confidence: 96.5%)',
    proofs: [{ fileName: 'bus_gps_screenshot.png' }],
    adminComments: []
  },
  {
    id: 'CMS-3923',
    category: 'Water Outage in Block-C',
    description: 'Hostel Block-C has had no running water on the 3rd floor since early morning. Restrooms are unusable.',
    assignedDept: 'HOSTEL',
    priority: 'CRITICAL',
    status: 'Assigned',
    slaHoursLeft: 0.5,
    isSlaOverdue: false,
    studentName: 'Aditya Sharma',
    studentRoll: '2025-ME-89',
    routingReasoning: 'AI Routing Engine matched keywords "Hostel Block-C", "running water", and "restrooms" with label HOSTEL. (Confidence: 99.1%)',
    proofs: [{ fileName: 'empty_tap_photo.jpg' }],
    adminComments: []
  },
  {
    id: 'CMS-3924',
    category: 'Defective Cricket Kits',
    description: 'The sports department issued cracked bats and torn leather balls for the inter-college selection matches.',
    assignedDept: 'SPORTS',
    priority: 'LOW',
    status: 'Submitted',
    slaHoursLeft: 22,
    isSlaOverdue: false,
    studentName: 'Vikram Singh',
    studentRoll: '2023-CE-67',
    routingReasoning: 'AI Routing Engine matched keywords "sports department", "cracked bats", and "balls" with label SPORTS. (Confidence: 95.0%)',
    proofs: [],
    adminComments: []
  },
  {
    id: 'CMS-3925',
    category: 'Midterm Grade Discrepancy',
    description: 'CS-301 Midterm exam marksheets distributed today contain typographical errors in the grade calculations for 15 students.',
    assignedDept: 'ACADEMIC',
    priority: 'MEDIUM',
    status: 'In Progress',
    slaHoursLeft: -5,
    isSlaOverdue: true,
    studentName: 'Neha Gupta',
    studentRoll: '2024-CS-33',
    routingReasoning: 'AI Routing Engine matched keywords "CS-301", "grade calculations", and "marksheets" with label ACADEMIC. (Confidence: 97.8%)',
    proofs: [{ fileName: 'marksheet_grades.pdf' }],
    adminComments: [
      { author: 'Academic Head', text: 'Initiated review of grader sheets.', timestamp: '11:15 AM' }
    ]
  },
  {
    id: 'CMS-3926',
    category: 'Lounge AC Malfunctioning',
    description: 'The guest house lounge air conditioning is blowing hot air, making it uncomfortable for visiting delegates.',
    assignedDept: 'HOSPITALITY',
    priority: 'MEDIUM',
    status: 'Resolved',
    slaHoursLeft: 12,
    isSlaOverdue: false,
    studentName: 'Rohan Joshi',
    studentRoll: '2024-HS-02',
    routingReasoning: 'AI Routing Engine matched keywords "guest house", "air conditioning", and "lounge" with label HOSPITALITY. (Confidence: 94.6%)',
    proofs: [],
    adminComments: [
      { author: 'Hospitality Tech', text: 'Replaced compressor unit.', timestamp: 'Yesterday' }
    ]
  }
];

// Initial Mock Notifications
const initialNotifications = [
  {
    id: 'notif-1',
    type: 'SLA_BREACH',
    message: 'Complaint CMS-3921 (Substandard Lunch Quality) has breached the SLA timer. Action required.',
    timestamp: '5 mins ago',
    isRead: false
  },
  {
    id: 'notif-2',
    type: 'AUTO_ESCALATION',
    message: 'AI Classifier auto-escalated CMS-3923 (Water Outage) to CRITICAL due to health hazard keywords.',
    timestamp: '20 mins ago',
    isRead: false
  },
  {
    id: 'notif-3',
    type: 'ROUTING_UPDATE',
    message: 'AI routing successfully assigned CMS-3925 to ACADEMIC Department.',
    timestamp: '1 hour ago',
    isRead: true
  }
];

// Initial Announcements History
const initialAnnouncements = [
  {
    id: 'BC-9812',
    audience: 'All Students',
    isUrgent: true,
    message: 'Maintenance Notice: C-Block Hostel water supply will be suspended on Aug 10 from 9:00 AM to 1:00 PM for pipeline repairs.',
    timestamp: 'Aug 09, 2026, 10:15 AM'
  },
  {
    id: 'BC-9811',
    audience: 'Members of Transport',
    isUrgent: false,
    message: 'Please note: Bus Route 4 will depart 15 minutes earlier starting tomorrow due to highway construction delays.',
    timestamp: 'Aug 08, 2026, 02:30 PM'
  }
];

export default function App() {
  const [complaints, setComplaints] = useState(initialComplaints);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [publishedAnnouncements, setPublishedAnnouncements] = useState(initialAnnouncements);

  // Filters & Drawer State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [activeTab, setActiveTab] = useState('ALL');
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  
  // Modals & Sliders Visibility
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isAddDeptHeadOpen, setIsAddDeptHeadOpen] = useState(false);

  // Add new department head handler (mock log)
  const handleAddDeptHead = (data) => {
    console.log('Added department head:', data);
    alert(`Successfully added ${data.fullName} as Department Head for ${data.department}! Temporary Password: ${data.tempPassword}`);
  };

  // Update a single complaint's details in App state
  const handleUpdateComplaint = (updated) => {
    setComplaints(prev => prev.map(c => c.id === updated.id ? updated : c));
    if (selectedComplaint && selectedComplaint.id === updated.id) {
      setSelectedComplaint(updated);
    }
  };

  // Publish announcement handler
  const handlePublishAnnouncement = (announcement) => {
    setPublishedAnnouncements(prev => [announcement, ...prev]);
  };

  // Delete announcement handler
  const handleDeleteAnnouncement = (id) => {
    setPublishedAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  // Notification handlers
  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Filter complaints based on Search, Dropdown Filter, and Active Tab
  const filteredComplaints = complaints.filter(item => {
    // 1. Filter by search query (checks ID, category, description, student roll)
    const matchesSearch = 
      item.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.studentRoll.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Filter by dropdown department selection (from header)
    const matchesHeaderDept = 
      selectedDepartment === 'ALL' || 
      item.assignedDept === selectedDepartment;

    // 3. Filter by active tab (matches tab filter)
    const matchesTabDept = 
      activeTab === 'ALL' || 
      item.assignedDept === activeTab;

    return matchesSearch && matchesHeaderDept && matchesTabDept;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      
      {/* Header Bar */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedDepartment={selectedDepartment}
        setSelectedDepartment={setSelectedDepartment}
        onBellClick={() => setIsNotificationsOpen(true)}
        unreadCount={notifications.filter(n => !n.isRead).length}
        onAddDeptHeadClick={() => setIsAddDeptHeadOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1600px] mx-auto pb-12">
        {activeTab !== 'ANNOUNCEMENTS' ? (
          <>
            {/* KPI Cards Row */}
            <MetricCards />

            {/* Department Filter Tabs */}
            <DepartmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

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
                    // Toggle selection
                    if (selectedComplaint && selectedComplaint.id === complaint.id) {
                      setSelectedComplaint(null);
                    } else {
                      setSelectedComplaint(complaint);
                    }
                  }}
                />
              </div>

              {/* Department Control Panel (visible only when row is selected) */}
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
            {/* Department Filter Tabs */}
            <DepartmentTabs activeTab={activeTab} setActiveTab={setActiveTab} />

            {/* Institutional Broadcast Notice System */}
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
