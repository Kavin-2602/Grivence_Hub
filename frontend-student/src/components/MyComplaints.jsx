import React, { useState, useEffect } from 'react';
import { Eye, Clock, AlertTriangle, ShieldCheck } from 'lucide-react';

export default function MyComplaints({ onSelectTicket }) {
  const [complaints, setComplaints] = useState([
    {
      ticket_id: "CMP-1042",
      title: "Piece of metal found in Block C lunch today",
      category: "Food / Safety Hazard",
      priority: "Critical",
      status: "AI Analysed",
      assigned_department_name: "Canteen Operations",
      created_at: "Today"
    },
    {
      ticket_id: "CMS-3921",
      title: "Substandard Lunch Quality",
      category: "Food / Safety Hazard",
      priority: "Critical",
      status: "In Progress",
      assigned_department_name: "Canteen Operations",
      created_at: "Yesterday"
    }
  ]);

  useEffect(() => {
    const fetchMyComplaints = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch('http://127.0.0.1:8000/api/v1/complaints/', {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setComplaints(data);
          }
        }
      } catch (err) {
        console.warn('Using seeded complaints list');
      }
    };
    fetchMyComplaints();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      <h2 className="text-xl font-black text-slate-900 mb-4">My Submitted Complaints</h2>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="divide-y divide-slate-100">
          {complaints.map((item) => (
            <div
              key={item.ticket_id}
              onClick={() => onSelectTicket(item.ticket_id)}
              className="p-5 hover:bg-slate-50 transition cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    #{item.ticket_id}
                  </span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white text-[10px] font-black rounded-full uppercase">
                    {item.priority}
                  </span>
                  <span className="text-xs font-bold text-slate-500">{item.category}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-900 mt-1">{item.title}</h3>
              </div>

              <div className="flex items-center gap-4">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-800 text-xs font-bold rounded-lg border border-blue-100">
                  {item.status}
                </span>
                <button
                  onClick={() => onSelectTicket(item.ticket_id)}
                  className="p-2 text-slate-400 hover:text-emerald-600 rounded-lg hover:bg-emerald-50 transition"
                  title="Track Ticket"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
