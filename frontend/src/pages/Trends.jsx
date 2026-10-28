// frontend/src/pages/Trends.jsx
import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function Trends() {
  const [trendData, setTrendData] = useState(null);
  const [message, setMessage] = useState("Loading health trends...");

  useEffect(() => {
    const loadTrends = async () => {
      try {
        const response = await fetch('http://127.0.0.1:8000/api/reports/trends/', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setTrendData(data);
          setMessage("");
        }
      } catch (error) {
        setMessage("Error loading trends.");
      }
    };
    loadTrends();
  }, []);

  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-lg w-full max-w-3xl mx-auto mt-4 text-[#17324D]">
      <div className="flex items-center gap-3 mb-4">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF5EF] text-[#0F766E]" aria-hidden="true">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 17l6-6 4 4 8-8" /><path d="M15 7h6v6" />
          </svg>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17324D]">Your Health Trends</h2>
      </div>

      <div className="mb-8 flex gap-3 p-4 bg-amber-50 text-amber-900 text-sm rounded-xl border border-amber-300">
        <span aria-hidden="true">ⓘ</span>
        <p><strong>Note:</strong> Changes require clinical context. Discuss trends with your doctor.</p>
      </div>

      {message && (
        <div role="status" aria-live="polite" className="flex items-center justify-center gap-3 rounded-2xl bg-[#DDF5EF]/60 border border-[#0F766E]/20 px-4 py-6 text-[#0F766E] font-bold">
          <span className="inline-flex items-end gap-0.5 h-5" aria-hidden="true">
            {['h-2', 'h-4', 'h-5', 'h-3', 'h-4'].map((h, i) => (
              <span key={i} className={`w-1 rounded-full bg-[#0F766E] ${h} animate-pulse motion-reduce:animate-none`} style={{ animationDelay: `${i * 150}ms` }}></span>
            ))}
          </span>
          {message}
        </div>
      )}

      {trendData && Object.keys(trendData).length === 0 ? (
        <div className="flex flex-col items-center text-center rounded-2xl border-2 border-dashed border-slate-300 bg-[#F8FAFC] px-6 py-12">
          <p className="text-lg font-semibold text-[#17324D]">No trend data available yet.</p>
          <p className="text-[#64748B] mt-1">Upload more reports to start tracking your results over time.</p>
        </div>
      ) : (
        trendData && Object.entries(trendData).map(([testName, data]) => (
          <div key={testName} className="mb-8 rounded-2xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm transition-shadow duration-300 hover:shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h3 className="text-xl font-bold text-[#17324D]">{testName}</h3>
              <span className="rounded-full bg-[#DDF5EF] px-3 py-1 text-sm font-bold text-[#0F766E]">Unit: {data.unit}</span>
            </div>
            <div className="h-64 w-full bg-[#F8FAFC] p-3 sm:p-4 rounded-xl ring-1 ring-slate-200">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" stroke="#64748B" />
                  <YAxis stroke="#64748B" />
                  <Tooltip contentStyle={{ borderRadius: '12px', borderColor: '#0F766E' }} />
                  <Legend />
                  <Line type="monotone" dataKey="value" name={`Value (${data.unit})`} stroke="#0F766E" strokeWidth={3} dot={{ r: 4, fill: '#0F766E' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))
      )}
    </div>
  );
}