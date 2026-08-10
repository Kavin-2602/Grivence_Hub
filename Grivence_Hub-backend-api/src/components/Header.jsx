import React from 'react';
import { Search, Bell, UserPlus } from 'lucide-react';
import Logo from './Logo';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  selectedDepartment, 
  setSelectedDepartment, 
  onBellClick, 
  unreadCount,
  onAddDeptHeadClick 
}) {
  const departments = [
    { code: 'ALL', label: 'All Departments' },
    { code: 'CANTEEN', label: 'Canteen' },
    { code: 'TRANSPORT', label: 'Transport' },
    { code: 'HOSTEL', label: 'Hostel' },
    { code: 'SPORTS', label: 'Sports' },
    { code: 'ACADEMIC', label: 'Academic' },
    { code: 'HOSPITALITY', label: 'Hospitality' }
  ];

  return (
    <header className="bg-brand-green text-white shadow-md sticky top-0 z-30">
      <div className="max-w-[1600px] mx-auto px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Brand and Title */}
        <div className="flex items-center gap-3">
          <Logo className="w-12 h-12 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-tight">
              CMSCE Admin Portal
            </h1>
            <p className="text-xs text-brand-yellow font-medium tracking-wide m-0">
              AI-Powered Complaint Management
            </p>
          </div>
        </div>

        {/* Center: Search & Department Dropdown */}
        <div className="flex flex-1 max-w-2xl w-full items-center gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-300" />
            </span>
            <input
              type="text"
              className="w-full bg-[#06341d] text-white placeholder-slate-300 border border-emerald-800 rounded-lg pl-10 pr-4 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all"
              placeholder="Search complaints, students, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Department dropdown */}
          <div className="w-48">
            <select
              className="w-full bg-[#06341d] text-white border border-emerald-800 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-yellow/50 focus:border-brand-yellow transition-all cursor-pointer"
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
            >
              {departments.map((dept) => (
                <option key={dept.code} value={dept.code} className="bg-brand-green text-white">
                  {dept.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center gap-4">
          {/* Add Department Head Action */}
          <button
            onClick={onAddDeptHeadClick}
            className="flex items-center gap-2 bg-brand-yellow hover:bg-brand-yellow-hover text-slate-900 font-semibold px-4 py-2 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Dept Head</span>
          </button>

          {/* Notification bell */}
          <button
            onClick={onBellClick}
            className="relative p-2 bg-[#06341d] hover:bg-emerald-800 border border-emerald-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Toggle notifications"
          >
            <Bell className="h-5 w-5 text-white" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-brand-green">
                {unreadCount}
              </span>
            )}
          </button>
        </div>

      </div>
    </header>
  );
}
