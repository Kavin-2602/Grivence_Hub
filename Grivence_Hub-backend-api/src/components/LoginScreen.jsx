import React, { useState } from 'react';
import Logo from './Logo';
import { Lock, Mail, LogIn, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginScreen({ onLoginSuccess }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Determine login mode from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const isStaff = loginMode === 'staff';
  const titleText = isStaff ? 'Department Staff Login' : 'Admin Login';
  const idLabel = isStaff ? 'Staff ID' : 'Admin ID';
  const idPlaceholder = isStaff ? 'e.g. canteen_head' : 'admin123';
  const headerColor = isStaff ? 'bg-indigo-700' : 'bg-slate-800';
  const buttonColor = isStaff ? 'bg-indigo-600 hover:bg-indigo-700 focus:ring-indigo-600/40' : 'bg-slate-800 hover:bg-slate-900 focus:ring-slate-800/40';
  const buttonRingColor = isStaff ? 'focus:border-indigo-600' : 'focus:border-slate-800';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) {
      setError(`${idLabel} and password are required.`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.ok) {
        const { access, user } = data;

        // Client-side UX safeguard based on intended role
        if (user.role === 'STUDENT') {
          setError('Student accounts cannot access this portal. Please use the Student Desk.');
          setLoading(false);
          return;
        }

        if (loginMode === 'admin' && user.role === 'DEPT_HEAD') {
          setError('This account is not an Admin account — use Department Staff Login instead.');
          setLoading(false);
          return;
        }
        if (loginMode === 'staff' && user.role === 'ADMIN') {
          setError('This account is not a Department Head account — use Admin Login instead.');
          setLoading(false);
          return;
        }

        localStorage.setItem('access_token', access);
        localStorage.setItem('token', access);
        localStorage.setItem('user', JSON.stringify(user));
        onLoginSuccess(access, user);
      } else {
        setError(data.detail || data.error || `Invalid ${idLabel} or password.`);
      }
    } catch (err) {
      setError('Network error — could not reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Brand Bar */}
      <header className={`${headerColor} shadow-md transition-colors duration-300`}>
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-3">
          <Logo className="w-12 h-12 flex-shrink-0" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white m-0 leading-tight">
              CMSCE Grievance Hub
            </h1>
            <p className={`text-xs ${isStaff ? 'text-indigo-200' : 'text-slate-300'} font-medium tracking-wide m-0`}>
              AI-Powered Complaint Management System
            </p>
          </div>
        </div>
      </header>

      {/* Login Card */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Card header */}
            <div className={`${headerColor} px-8 py-6 text-center transition-colors duration-300`}>
              <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-full mb-3">
                <Lock className={`w-7 h-7 ${isStaff ? 'text-indigo-200' : 'text-slate-300'}`} />
              </div>
              <h2 className="text-xl font-bold text-white m-0">{titleText}</h2>
              <p className={`text-xs ${isStaff ? 'text-indigo-200' : 'text-slate-300'} mt-1 m-0`}>
                Sign in to access your portal
              </p>
            </div>

            {/* Card body */}
            <div className="px-8 py-8">
              {error && (
                <div className="mb-5 flex items-start gap-2.5 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* ID Field */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    {idLabel}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      id="login-id"
                      type="text"
                      autoComplete="username"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={idPlaceholder}
                      required
                      className={`w-full pl-9 pr-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 ${buttonRingColor} transition-all`}
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-4 w-4 text-slate-400" />
                    </span>
                    <input
                      id="login-password"
                      type={showPw ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      className="w-full pl-9 pr-10 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-green/40 focus:border-brand-green transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  id="login-submit"
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 ${buttonColor} disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-colors shadow cursor-pointer`}
                >
                  {loading ? (
                    <>
                      <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Signing in…
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Sign In
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-[11px] text-slate-400">
                Admin and Department Heads only. Student accounts use the{' '}
                <span className="font-semibold text-slate-500">Student Portal</span>.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-[11px] text-slate-400">
        © 2026 CMSCE Grievance Hub — Secured Portal
      </footer>
    </div>
  );
}
