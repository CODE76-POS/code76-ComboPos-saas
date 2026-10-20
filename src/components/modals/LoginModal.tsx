import React, { useState } from 'react';
import { usePOS } from '../../context/POSContext.tsx';
import { Lock, Mail, KeyRound, Shield, X, UserPlus, LogIn, CheckCircle2, AlertCircle } from 'lucide-react';
import { ALL_ROLES, UserRole } from '../../types/index.ts';

export const LoginModal: React.FC = () => {
  const { loginModalOpen, setLoginModalOpen, currentUser, loginUser, logoutUser } = usePOS();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [role, setRole] = useState<UserRole>('Cashier');
  const [fullName, setFullName] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  if (!loginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (mode === 'login') {
      const res = loginUser(email, password, role);
      if (res.success) {
        setSuccessMsg('Authentication successful! Welcome to CODE76 POS.');
        setTimeout(() => {
          setSuccessMsg('');
          setLoginModalOpen(false);
        }, 1200);
      } else {
        setErrorMsg(res.message);
      }
    } else {
      // Registration: registers user and automatically sets them as active user
      if (password.length < 4) {
        setErrorMsg('Password must be at least 4 characters.');
        return;
      }
      loginUser(email, password, role);
      setSuccessMsg(`User account registered with role: ${role}!`);
      setTimeout(() => {
        setSuccessMsg('');
        setLoginModalOpen(false);
      }, 1200);
    }
  };

  const handleLogout = () => {
    logoutUser();
    setSuccessMsg('Logged out successfully.');
    setTimeout(() => {
      setSuccessMsg('');
      setLoginModalOpen(false);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4">
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-4 sm:p-6 text-white animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={() => setLoginModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center border border-teal-500/30">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs uppercase tracking-wider font-bold text-teal-400">
              Role-Based Access Control
            </span>
            <h3 className="text-xl font-bold text-slate-100">
              {currentUser ? 'Active User Session' : mode === 'login' ? 'Sign In to CODE76 POS' : 'Register New User'}
            </h3>
          </div>
        </div>

        {currentUser ? (
          <div className="space-y-4 my-2">
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-xl p-4 text-center">
              <div className="w-16 h-16 rounded-full bg-teal-500/20 text-teal-300 font-bold text-xl flex items-center justify-center mx-auto mb-3 border border-teal-500/40">
                {currentUser.name.slice(0, 2).toUpperCase()}
              </div>
              <h4 className="font-bold text-lg text-slate-100">{currentUser.name}</h4>
              <p className="text-xs text-slate-400">{currentUser.email}</p>
              <div className="flex justify-center gap-2 mt-3">
                {currentUser.roles.map((r, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 text-xs rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 font-semibold"
                  >
                    Role: {r}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setLoginModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-sm font-medium transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={handleLogout}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-semibold shadow-md transition cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {errorMsg && (
              <div className="bg-rose-950/60 border border-rose-800/60 rounded-xl p-3 text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-emerald-950/60 border border-emerald-800/60 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>{successMsg}</span>
              </div>
            )}

            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Samuel Kiprono"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@business.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-teal-400" />
                App Role
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-teal-500"
              >
                {ALL_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                className="text-xs text-teal-400 hover:text-teal-300 font-medium hover:underline cursor-pointer"
              >
                {mode === 'login' ? 'Need an account? Register new user' : 'Already registered? Switch to Login'}
              </button>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold shadow-lg shadow-teal-600/30 transition flex items-center gap-2 cursor-pointer"
              >
                {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {mode === 'login' ? 'Sign In' : 'Register User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
