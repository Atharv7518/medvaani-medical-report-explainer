// frontend/src/pages/Login.jsx
import React, { useState } from 'react';
import logo from '../assets/logo.png';

export default function Login({ onAuthSuccess, goToSignup }) {
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/reports/login/`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ login_id: loginId, password })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('is_admin', data.is_admin);
        onAuthSuccess(data.is_admin);
      } else setError(data.error);
    } catch { setError('Server error.'); }
  };

  const inputClass =
    'w-full border border-slate-300 p-3.5 rounded-xl bg-slate-50 text-[#17324D] text-lg placeholder:text-slate-400 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-[#0F766E]/25 focus:border-[#0F766E] focus:bg-white';

  return (
    <div className="min-h-screen bg-[#F8FAFC] grid grid-cols-1 lg:grid-cols-2">

      {/* LEFT: friendly illustration panel (hidden on small screens) */}
      <aside className="relative hidden lg:flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#DDF5EF] via-white to-[#DDF5EF] p-12 text-[#17324D]">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#0F766E]/10 blur-3xl" aria-hidden="true"></div>
        <div className="pointer-events-none absolute -bottom-32 -right-20 h-96 w-96 rounded-full bg-[#0F766E]/10 blur-3xl" aria-hidden="true"></div>

        <div className="relative max-w-md text-center">
          {/* Illustration: report card turning into a voice wave */}
          <div className="relative mx-auto mb-10 h-64 w-64" aria-hidden="true">
            <div className="absolute inset-0 rounded-[2.5rem] bg-white shadow-2xl ring-1 ring-slate-200"></div>
            <div className="absolute left-6 top-6 right-6 space-y-3">
              <div className="h-3 w-2/3 rounded-full bg-slate-200"></div>
              <div className="h-3 w-full rounded-full bg-slate-100"></div>
              <div className="h-3 w-5/6 rounded-full bg-slate-100"></div>
              <div className="h-3 w-1/2 rounded-full bg-slate-100"></div>
            </div>
            <div className="absolute bottom-6 left-6 right-6 flex items-end justify-center gap-2 rounded-2xl bg-[#DDF5EF] px-4 py-4">
              {['h-4', 'h-8', 'h-12', 'h-6', 'h-10', 'h-5', 'h-8'].map((h, i) => (
                <span
                  key={i}
                  className={`w-2.5 rounded-full bg-[#0F766E] ${h} animate-pulse motion-reduce:animate-none`}
                  style={{ animationDelay: `${i * 140}ms` }}
                ></span>
              ))}
            </div>
          </div>

          <h2 className="text-4xl font-extrabold tracking-tight">Your Medical Report.<br /><span className="text-[#0F766E]">Your Language.</span></h2>
          <p className="mt-4 text-lg text-[#64748B]">
            Understand your lab results in plain Hindi, Punjabi or English, and listen to them whenever you like.
          </p>
        </div>
      </aside>

      {/* RIGHT: login form */}
      <main className="flex flex-col items-center justify-center py-10 px-4 sm:px-8">
        <div className="w-full max-w-md">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center justify-center h-20 w-20 rounded-full bg-white shadow-lg ring-1 ring-slate-200 mb-4">
              <img src={logo} alt="MedVaani logo" className="h-14 w-14 object-contain" />
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#17324D]">Med<span className="text-[#0F766E]">Vaani</span></span>
          </div>

          <div className="bg-white p-8 sm:p-10 rounded-3xl shadow-xl ring-1 ring-slate-200">
            <h1 className="text-3xl font-extrabold text-[#17324D] mb-2 text-center tracking-tight">Welcome Back</h1>
            <p className="text-[#64748B] text-center mb-8">Sign in to access your health reports.</p>

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="login-id" className="block text-[#17324D] font-semibold mb-2">Email or Phone Number</label>
                <input id="login-id" type="text" autoComplete="username" placeholder="Email OR Phone Number" value={loginId} onChange={e => setLoginId(e.target.value)} className={inputClass} required />
              </div>
              <div>
                <label htmlFor="login-password" className="block text-[#17324D] font-semibold mb-2">Password</label>
                <input id="login-password" type="password" autoComplete="current-password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className={inputClass} required />
              </div>
              {error && <p role="alert" className="text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3 font-semibold text-sm">{error}</p>}
              <button type="submit" className="w-full bg-[#0F766E] text-white font-bold text-xl py-4 min-h-[56px] rounded-xl shadow-lg hover:bg-[#0B5F59] hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F766E]/30">Secure Login</button>
            </form>

            <div className="my-6 flex items-center gap-3 text-sm text-[#64748B]" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200"></span>
              <span>or</span>
              <span className="h-px flex-1 bg-slate-200"></span>
            </div>

            <button onClick={goToSignup} className="w-full min-h-[52px] rounded-xl border-2 border-[#0F766E] text-[#0F766E] font-bold text-lg transition-all duration-300 hover:bg-[#DDF5EF] hover:scale-[1.02] active:scale-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F766E]/30">
              New user? Sign Up
            </button>
          </div>

          <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[#64748B] text-center">
            <svg className="h-4 w-4 shrink-0 text-[#0F766E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
            </svg>
            Your reports are private and used only to explain your results.
          </p>
        </div>
      </main>
    </div>
  );
}