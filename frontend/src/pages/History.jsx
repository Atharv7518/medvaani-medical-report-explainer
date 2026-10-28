// frontend/src/pages/History.jsx
import React from 'react';

export default function History({ historyData, viewPastReport }) {
  return (
    <div className="bg-white p-6 sm:p-10 rounded-3xl border border-slate-200 shadow-lg w-full max-w-3xl mx-auto mt-4 text-[#17324D]">
      <div className="flex items-center gap-3 mb-2">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#DDF5EF] text-[#0F766E]" aria-hidden="true">
          <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17324D]">Your Past Reports</h2>
      </div>
      <p className="text-[#64748B] mb-8">Select a report to view its results, explanation and audio again.</p>

      {historyData.length === 0 ? (
        <div className="flex flex-col items-center text-center rounded-2xl border-2 border-dashed border-slate-300 bg-[#F8FAFC] px-6 py-12">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0F766E] shadow-sm ring-1 ring-slate-200 mb-4" aria-hidden="true">
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" />
            </svg>
          </span>
          <p className="text-lg font-semibold text-[#17324D]">You haven't uploaded any reports yet.</p>
          <p className="text-[#64748B] mt-1">Your uploaded reports will appear here as a timeline.</p>
        </div>
      ) : (
        <ol className="relative border-l-2 border-[#DDF5EF] ml-3 space-y-5">
          {historyData.map((report) => (
            <li key={report.id} className="relative pl-6 sm:pl-8">
              {/* Timeline dot */}
              <span className="absolute -left-[9px] top-6 h-4 w-4 rounded-full bg-[#0F766E] ring-4 ring-white" aria-hidden="true"></span>

              <button
                type="button"
                onClick={() => viewPastReport(report.id)}
                className="group w-full text-left rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:border-[#0F766E]/50 hover:shadow-lg hover:-translate-y-0.5 motion-reduce:hover:translate-y-0 focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F766E]/30"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-lg font-bold text-[#17324D]">
                    <svg className="h-5 w-5 text-[#0F766E]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" />
                    </svg>
                    <span>{new Date(report.uploaded_at).toLocaleDateString()}</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[#DDF5EF] px-3 py-1 text-sm font-bold text-[#0F766E]">
                    <span className="h-2 w-2 rounded-full bg-[#0F766E]" aria-hidden="true"></span>
                    {report.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <p className="text-xs text-[#64748B] break-all">Report ID: {report.id}</p>
                  <span className="shrink-0 text-sm font-semibold text-[#0F766E] transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0">
                    View report →
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}