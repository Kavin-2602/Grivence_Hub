import React from 'react';
import { Ticket, AlertTriangle, Clock, Activity, ArrowUp, ArrowDown } from 'lucide-react';

export default function MetricCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-[1600px] mx-auto px-6 py-6">
      
      {/* 1. Total Open Tickets */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Total Open Tickets
          </span>
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Ticket className="h-6 w-6 text-emerald-700" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">47</span>
          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
            <ArrowUp className="h-3 w-3" />
            +12 this week
          </span>
        </div>
      </div>

      {/* 2. Critical Escalations */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-rose-600">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Critical Escalations
          </span>
          <div className="p-2 bg-rose-50 rounded-lg">
            <AlertTriangle className="h-6 w-6 text-rose-600" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold text-slate-900">8</span>
          <p className="text-xs font-medium text-rose-600 mt-1 flex items-center gap-1">
            Requires immediate action
          </p>
        </div>
      </div>

      {/* 3. SLA Breaches */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow border-l-4 border-l-amber-500">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            SLA Breaches
          </span>
          <div className="p-2 bg-amber-50 rounded-lg">
            <Clock className="h-6 w-6 text-amber-600" />
          </div>
        </div>
        <div className="mt-4">
          <span className="text-3xl font-extrabold text-slate-900">5</span>
          <p className="text-xs font-medium text-amber-600 mt-1">
            3 overdue &gt; 24h
          </p>
        </div>
      </div>

      {/* 4. Avg. Resolution Time */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">
            Avg. Resolution Time
          </span>
          <div className="p-2 bg-blue-50 rounded-lg">
            <Activity className="h-6 w-6 text-blue-700" />
          </div>
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-slate-900">18.4h</span>
          <span className="inline-flex items-center gap-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
            <ArrowDown className="h-3 w-3" />
            -3.6h last cycle
          </span>
        </div>
      </div>

    </div>
  );
}
