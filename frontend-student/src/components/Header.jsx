import React from 'react';
import CMSLotusLogo from './CMSLotusLogo';
import { Bell, LogOut, FileText, User } from 'lucide-react';

export default function Header({ 
  user, 
  activeScreen, 
  setActiveScreen, 
  unreadCount, 
  onBellClick, 
  onLogout 
}) {
  return (
    <header className="bg-slate-900 text-white sticky top-0 z-40 border-b border-slate-800 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveScreen('DESK')}>
          <CMSLotusLogo className="w-10 h-10" />
          <div>
            <span className="text-lg font-black tracking-tight text-white block leading-none">CMSCE</span>
            <span className="text-[10px] font-semibold text-emerald-400 uppercase tracking-widest block mt-0.5">Student Desk</span>
          </div>
        </div>

        {/* Navigation Actions */}
        {user ? (
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setActiveScreen('MY_COMPLAINTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                activeScreen === 'MY_COMPLAINTS' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              My Complaints
            </button>

            <button
              onClick={onBellClick}
              className="relative p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-amber-500 text-slate-950 font-extrabold text-[10px] rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800 text-xs">
              <User className="w-4 h-4 text-emerald-400" />
              <span className="font-semibold text-slate-200">{user.full_name || user.email}</span>
            </div>

            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setActiveScreen('LOGIN')}
              className="text-xs font-bold px-3 py-1.5 text-slate-300 hover:text-white cursor-pointer"
            >
              Login
            </button>
            <button
              onClick={() => setActiveScreen('REGISTER')}
              className="text-xs font-bold px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition shadow cursor-pointer"
            >
              Register
            </button>
          </div>
        )}

      </div>
    </header>
  );
}
