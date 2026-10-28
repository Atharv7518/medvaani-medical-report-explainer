// frontend/src/pages/Splash.jsx
import React from 'react';
import logo from '../assets/logo.png';

export default function Splash() {
  return (
    <div
      role="status"
      aria-label="Loading MedVaani"
      className="relative min-h-screen overflow-hidden bg-gradient-to-b from-white via-[#F8FAFC] to-[#DDF5EF] flex flex-col items-center justify-center px-6 text-[#17324D] transition-opacity duration-1000"
    >
      {/* Soft decorative glow */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#DDF5EF] opacity-70 blur-3xl" aria-hidden="true"></div>
      <div className="pointer-events-none absolute -bottom-32 -left-24 h-96 w-96 rounded-full bg-[#DDF5EF] opacity-80 blur-3xl" aria-hidden="true"></div>

      <div className="relative flex flex-col items-center text-center">
        {/* Your logo with a soft pulse ring */}
        <div className="relative mb-8">
          <span className="absolute inset-0 rounded-full bg-[#0F766E]/20 animate-ping motion-reduce:animate-none" aria-hidden="true"></span>
          <span className="absolute -inset-3 rounded-full ring-1 ring-[#0F766E]/20" aria-hidden="true"></span>
          <div className="relative flex items-center justify-center h-36 w-36 rounded-full bg-white shadow-2xl ring-1 ring-slate-200">
            <img src={logo} alt="MedVaani logo" className="h-24 w-24 object-contain" />
          </div>
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[#17324D]">
          Med<span className="text-[#0F766E]">Vaani</span>
        </h1>
        <p className="mt-4 text-xl sm:text-2xl font-medium text-[#64748B]">
          Your Medical Report. Your Language.
        </p>

        {/* Vaani Wave loader */}
        <div className="mt-10 flex items-end gap-1.5 h-8" aria-hidden="true">
          <span className="w-1.5 h-3 rounded-full bg-[#0F766E] animate-pulse motion-reduce:animate-none"></span>
          <span className="w-1.5 h-6 rounded-full bg-[#0F766E] animate-pulse motion-reduce:animate-none [animation-delay:150ms]"></span>
          <span className="w-1.5 h-8 rounded-full bg-[#0F766E] animate-pulse motion-reduce:animate-none [animation-delay:300ms]"></span>
          <span className="w-1.5 h-5 rounded-full bg-[#0F766E] animate-pulse motion-reduce:animate-none [animation-delay:450ms]"></span>
          <span className="w-1.5 h-4 rounded-full bg-[#0F766E] animate-pulse motion-reduce:animate-none [animation-delay:600ms]"></span>
        </div>
      </div>
    </div>
  );
}