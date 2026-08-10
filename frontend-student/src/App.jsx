import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AuthScreens from './components/AuthScreens';
import ComplaintDesk from './components/ComplaintDesk';
import TicketTracker from './components/TicketTracker';
import MyComplaints from './components/MyComplaints';
import NotificationsDrawer from './components/NotificationsDrawer';
import MobileBottomNav from './components/MobileBottomNav';

export default function App() {
  const [user, setUser] = useState({ email: 'student1@cmsce.edu', full_name: 'Amit Verma', role: 'STUDENT' });
  const [activeScreen, setActiveScreen] = useState('DESK'); // DESK, TRACKER, MY_COMPLAINTS, LOGIN, REGISTER, FORGOT_PASSWORD
  const [trackedTicketId, setTrackedTicketId] = useState('CMP-1042');
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-s1',
      type: 'SLA_CRITICAL_OVERRIDE',
      message: 'AI Classifier assigned Critical priority and 4h SLA deadline to Ticket #CMP-1042 (Metal in Canteen Lunch).',
      timestamp: '30 mins ago'
    }
  ]);

  // Ensure valid student auth token is present in localStorage on load
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      fetch('http://127.0.0.1:8000/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student1@cmsce.edu', password: 'Password123!' })
      })
        .then(res => res.json())
        .then(data => {
          if (data.access) {
            localStorage.setItem('access_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
          }
        })
        .catch(err => console.warn('Student auto-login failed:', err));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setActiveScreen('LOGIN');
  };

  const handleTicketCreated = (ticketId) => {
    setTrackedTicketId(ticketId);
    setActiveScreen('TRACKER');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans pb-16 md:pb-0">
      
      {/* Header */}
      <Header
        user={user}
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        unreadCount={notifications.length}
        onBellClick={() => setIsNotifOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {['LOGIN', 'REGISTER', 'FORGOT_PASSWORD'].includes(activeScreen) && (
          <AuthScreens
            screen={activeScreen}
            onNavigate={setActiveScreen}
            onLoginSuccess={(loggedInUser) => {
              setUser(loggedInUser);
              setActiveScreen('DESK');
            }}
          />
        )}

        {activeScreen === 'DESK' && (
          <ComplaintDesk
            user={user}
            onTicketCreated={handleTicketCreated}
          />
        )}

        {activeScreen === 'TRACKER' && (
          <TicketTracker
            ticketId={trackedTicketId}
            onBack={() => setActiveScreen('DESK')}
          />
        )}

        {activeScreen === 'MY_COMPLAINTS' && (
          <MyComplaints
            onSelectTicket={(tId) => {
              setTrackedTicketId(tId);
              setActiveScreen('TRACKER');
            }}
          />
        )}

      </main>

      {/* Slide-out Notifications Drawer */}
      <NotificationsDrawer
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
        notifications={notifications}
        onClearAll={() => setNotifications([])}
      />

      {/* Mobile Bottom Navigation Bar (375px Viewport) */}
      <MobileBottomNav
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        unreadCount={notifications.length}
        onBellClick={() => setIsNotifOpen(true)}
      />

      {/* Footer */}
      <footer className="hidden md:block bg-slate-900 text-slate-500 py-6 border-t border-slate-800 text-center text-xs mt-auto">
        <div className="max-w-7xl mx-auto px-4">
          <p>© 2026 CMSCE Student Portal • AI-Powered Grievance System v1.2</p>
          <p className="mt-1 text-[10px] text-slate-600">Connected to http://127.0.0.1:8000/api/v1/ • Branch: main</p>
        </div>
      </footer>

    </div>
  );
}
