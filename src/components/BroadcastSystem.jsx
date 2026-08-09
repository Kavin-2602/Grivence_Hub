import React, { useState } from 'react';
import { Megaphone, Users, Trash2 } from 'lucide-react';

export default function BroadcastSystem({ onPublishAnnouncement, publishedAnnouncements, onDeleteAnnouncement }) {
  const [audience, setAudience] = useState('ALL_STUDENTS');
  const [specificDept, setSpecificDept] = useState('ACADEMIC');
  const [isUrgent, setIsUrgent] = useState(false);
  const [message, setMessage] = useState('');

  const departments = [
    { code: 'CANTEEN', label: 'Canteen' },
    { code: 'TRANSPORT', label: 'Transport' },
    { code: 'HOSTEL', label: 'Hostel' },
    { code: 'SPORTS', label: 'Sports' },
    { code: 'ACADEMIC', label: 'Academic' },
    { code: 'HOSPITALITY', label: 'Hospitality' }
  ];

  const getAudienceLabel = (aud, dept) => {
    switch (aud) {
      case 'ALL_STUDENTS':
        return 'All Students';
      case 'ALL_DEPT_HEADS':
        return 'All Department Heads';
      case 'SPECIFIC_DEPT':
        return `Members of ${departments.find(d => d.code === dept)?.label || dept}`;
      default:
        return aud;
    }
  };

  const handlePublish = (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    onPublishAnnouncement({
      id: `BC-${Date.now().toString().slice(-4)}`,
      audience: getAudienceLabel(audience, specificDept),
      isUrgent,
      message: message.trim(),
      timestamp: new Date().toLocaleString([], { 
        month: 'short', 
        day: '2-digit', 
        year: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    });

    // Reset message
    setMessage('');
    alert('Broadcast published successfully!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-[1600px] mx-auto px-6 py-6 animate-in fade-in duration-300">
      
      {/* Left Column: Compose Broadcast */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <div className="p-2 bg-emerald-50 rounded-lg">
            <Megaphone className="h-6 w-6 text-brand-green" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800 m-0">Compose Broadcast Notice</h2>
            <p className="text-xs text-slate-500 m-0">Send instant campus-wide announcements or target specific departments.</p>
          </div>
        </div>

        <form onSubmit={handlePublish} className="space-y-4">
          {/* Target Audience */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Target Audience
            </label>
            <select
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-slate-800 transition-all cursor-pointer"
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
            >
              <option value="ALL_STUDENTS">All Students</option>
              <option value="ALL_DEPT_HEADS">All Department Heads</option>
              <option value="SPECIFIC_DEPT">Specific Department</option>
            </select>
          </div>

          {/* Conditional Specific Department */}
          {audience === 'SPECIFIC_DEPT' && (
            <div className="animate-in slide-in-from-top duration-200">
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
                Select Department
              </label>
              <select
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-slate-800 transition-all cursor-pointer"
                value={specificDept}
                onChange={(e) => setSpecificDept(e.target.value)}
              >
                {departments.map((dept) => (
                  <option key={dept.code} value={dept.code}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Priority Toggle */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Priority Level
            </label>
            <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
              <button
                type="button"
                onClick={() => setIsUrgent(false)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  !isUrgent 
                    ? 'bg-white text-brand-green shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setIsUrgent(true)}
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                  isUrgent 
                    ? 'bg-rose-600 text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Urgent / Critical
              </button>
            </div>
          </div>

          {/* Message Text */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wider">
              Broadcast Message
            </label>
            <textarea
              required
              rows="5"
              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-green/30 focus:border-brand-green text-slate-800 transition-all"
              placeholder="Type announcement description..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!message.trim()}
            className="w-full bg-brand-green hover:bg-brand-green-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg text-sm transition-colors shadow-sm cursor-pointer"
          >
            Publish Broadcast Notice
          </button>

        </form>
      </div>

      {/* Right Column: Live Preview & Sent Announcements */}
      <div className="space-y-6">
        
        {/* Live Preview Card */}
        <div className="bg-slate-50 rounded-xl border border-slate-200 p-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Live Preview</h3>
          
          <div className={`bg-white rounded-xl border p-5 shadow-sm space-y-3 transition-all relative ${
            isUrgent ? 'border-rose-200 ring-2 ring-rose-500/20' : 'border-slate-200'
          }`}>
            <div className="flex justify-between items-start gap-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                <span className="text-xs font-bold text-slate-600">
                  Target: {getAudienceLabel(audience, specificDept)}
                </span>
              </div>
              <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                isUrgent 
                  ? 'bg-rose-100 text-rose-800 animate-pulse' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isUrgent ? 'Urgent' : 'Normal'}
              </span>
            </div>
            
            <h4 className="text-slate-800 font-bold text-base m-0 flex items-center gap-1.5">
              <Megaphone className="h-4 w-4 text-brand-green" />
              CMS Portal Broadcast Notice
            </h4>
            
            <p className="text-sm text-slate-600 font-medium whitespace-pre-wrap leading-relaxed min-h-[60px]">
              {message.trim() || 'Type your message in the compose box to preview...'}
            </p>
            
            <div className="text-[10px] text-slate-400 font-semibold border-t border-slate-100 pt-2 text-right">
              {new Date().toLocaleString([], { month: 'short', day: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* Sent / History List */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 max-h-[350px] overflow-y-auto">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">Broadcast History</h3>
          
          {publishedAnnouncements.length === 0 ? (
            <p className="text-xs text-slate-400 italic py-4 text-center">No broadcasts sent yet.</p>
          ) : (
            <div className="space-y-3">
              {publishedAnnouncements.map((bc) => (
                <div key={bc.id} className="p-3.5 border border-slate-150 rounded-lg flex justify-between items-start gap-4 hover:bg-slate-50 transition-colors">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase">Target: {bc.audience}</span>
                      <span className={`text-[9px] px-1 rounded font-bold uppercase ${
                        bc.isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {bc.isUrgent ? 'Urgent' : 'Normal'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-normal">{bc.message}</p>
                    <span className="text-[9px] text-slate-400 block font-mono">{bc.timestamp}</span>
                  </div>
                  <button
                    onClick={() => onDeleteAnnouncement(bc.id)}
                    className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                    title="Delete notice"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
