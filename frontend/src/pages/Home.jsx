// frontend/src/pages/Home.jsx
import React from 'react';

// Small "Vaani Wave" motif (sound-wave bars) reused in the language selector and audio player
function VaaniWave({ className = 'h-5', animate = false }) {
  const heights = ['h-2', 'h-4', 'h-5', 'h-3', 'h-4'];
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} aria-hidden="true">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-1 rounded-full bg-[#0F766E] ${h} ${animate ? 'animate-pulse motion-reduce:animate-none' : ''}`}
          style={animate ? { animationDelay: `${i * 150}ms` } : undefined}
        ></span>
      ))}
    </span>
  );
}

function UploadIcon({ className = 'h-8 w-8' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
    </svg>
  );
}

function MicIcon({ className = 'h-6 w-6' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v3" />
    </svg>
  );
}

const focusRing = 'focus:outline-none focus-visible:ring-4 focus-visible:ring-[#0F766E]/30';
const card = 'bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 w-full';

export default function Home({
  targetLanguage, setTargetLanguage,
  handleFileChange, handleUpload, message,
  extractedData, handleValueEdit, handleExplain,
  explanation, doctorQuestions, handleDoctorPrep,
  chatQuestion, setChatQuestion, startListening, isListening,
  handleAskQuestion, isChatting, chatAnswer
}) {
  return (
    <div className="w-full flex flex-col items-center space-y-8 mt-4 text-[#17324D]">

      {/* 1. UPLOAD SECTION */}
      <div className="w-full max-w-3xl space-y-6">

        {/* Hero + three-step visual */}
        <div className="text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#17324D]">Explain My Medical Report</h1>
          <p className="mt-2 text-lg text-[#64748B]">Upload your report and understand it in your own language.</p>
        </div>

        <ol className="grid grid-cols-3 gap-3" aria-label="How it works">
          {[
            { n: 1, t: 'Upload', d: 'Add your report' },
            { n: 2, t: 'Understand', d: 'Plain-language summary' },
            { n: 3, t: 'Listen', d: 'Hear it in your language' },
          ].map((s) => (
            <li key={s.n} className="flex flex-col items-center text-center bg-white border border-slate-200 rounded-2xl p-3 sm:p-4 shadow-sm">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDF5EF] text-[#0F766E] font-bold">{s.n}</span>
              <span className="mt-2 font-bold text-[#17324D]">{s.t}</span>
              <span className="hidden sm:block text-sm text-[#64748B]">{s.d}</span>
            </li>
          ))}
        </ol>

        <div className={`${card} shadow-lg`}>
          <div className="mb-6">
            <label htmlFor="language-select" className="flex items-center gap-2 text-[#17324D] text-lg font-bold mb-2">
              <VaaniWave className="h-5" /> Select Language:
            </label>
            <select id="language-select" value={targetLanguage} onChange={(e) => setTargetLanguage(e.target.value)} className={`w-full border border-slate-300 p-3.5 rounded-xl text-lg bg-slate-50 text-[#17324D] transition-all duration-300 focus:border-[#0F766E] focus:bg-white ${focusRing}`}>
              <option value="Hindi">Hindi (हिंदी)</option>
              <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
              <option value="English">English</option>
            </select>
          </div>

          <div className="mb-6">
            <span className="block text-[#17324D] text-lg font-bold mb-2">Upload Report (PDF/Image):</span>
            {/* Drag-and-drop zone: the real file input covers the card, so click and drop both work */}
            <div className="relative flex flex-col items-center justify-center text-center gap-2 rounded-2xl border-2 border-dashed border-[#0F766E]/40 bg-[#DDF5EF]/40 px-6 py-10 transition-all duration-300 hover:border-[#0F766E] hover:bg-[#DDF5EF]/70 focus-within:ring-4 focus-within:ring-[#0F766E]/30">
              <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-[#0F766E] shadow-sm ring-1 ring-slate-200">
                <UploadIcon />
              </span>
              <p className="text-lg font-bold text-[#17324D]">Drag &amp; drop your report here</p>
              <p className="text-sm text-[#64748B]">or click to browse · PDF, PNG, JPG</p>
              <input
                type="file"
                onChange={handleFileChange}
                aria-label="Upload medical report (PDF or image)"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                accept=".pdf,.png,.jpg,.jpeg"
              />
            </div>
          </div>

          <button onClick={handleUpload} className={`w-full bg-[#0F766E] text-white font-bold text-xl py-4 px-4 min-h-[56px] rounded-xl shadow-lg hover:bg-[#0B5F59] hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all duration-300 ${focusRing}`}>
            Upload and Extract
          </button>
          {message && <div role="status" aria-live="polite" className="mt-6 p-4 bg-[#DDF5EF] text-[#17324D] font-semibold text-lg rounded-xl text-center border border-[#0F766E]/20">{message}</div>}
        </div>
      </div>

      {/* 2. VERIFICATION TABLE */}
      {extractedData.length > 0 && !explanation && (
        <div className={`${card} max-w-3xl shadow-lg`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDF5EF] text-[#0F766E] font-bold">2</span>
            <h2 className="text-2xl font-extrabold tracking-tight text-[#17324D]">Step 2: Verify Extracted Data</h2>
          </div>
          <p className="text-[#64748B] mb-6">Check each value against your report. Edit anything that looks wrong.</p>

          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {extractedData.map((item) => (
              <li key={item.id} className={`rounded-2xl border p-4 transition-all duration-300 hover:shadow-md ${item.is_uncertain ? 'bg-amber-50 border-amber-300' : 'bg-white border-slate-200'}`}>
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-bold text-[#17324D]">{item.test_name}</span>
                  {item.is_uncertain && <span className="text-xs bg-amber-200 text-amber-900 px-2.5 py-1 rounded-full font-bold whitespace-nowrap">⚠ Please Verify</span>}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={item.value}
                    onChange={(e) => handleValueEdit(item.id, e.target.value)}
                    aria-label={`Value for ${item.test_name}`}
                    className={`w-full min-w-0 p-3 border rounded-xl text-lg font-bold text-[#0F766E] transition-all duration-300 focus:border-[#0F766E] ${focusRing} ${item.is_uncertain ? 'border-amber-400 bg-amber-100' : 'border-slate-300 bg-slate-50'}`}
                  />
                  <span className="shrink-0 text-[#64748B] font-medium">{item.unit}</span>
                </div>
              </li>
            ))}
          </ul>

          <button onClick={handleExplain} className={`bg-[#0F766E] text-white font-bold text-lg py-4 px-6 min-h-[56px] rounded-xl shadow-lg hover:bg-[#0B5F59] hover:shadow-xl hover:scale-[1.02] active:scale-100 transition-all duration-300 w-full ${focusRing}`}>
            Confirm and Get Explanation
          </button>
        </div>
      )}

      {/* 3. EXPLANATION & AUDIO */}
      {explanation && (
        <div className={`${card} max-w-3xl shadow-lg border-l-8 border-l-[#0F766E]`}>
          <div className="flex items-center gap-3 mb-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#DDF5EF] text-[#0F766E] font-bold">✓</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#17324D]">Your Report Explanation</h2>
          </div>

          {explanation?.audio && (
            <div className="mb-8 p-6 bg-gradient-to-br from-[#DDF5EF] to-white rounded-2xl flex flex-col items-center border border-[#0F766E]/20 shadow-md">
              <p className="flex items-center gap-3 text-[#17324D] font-bold text-xl mb-4 text-center">
                <VaaniWave className="h-6" animate /> Listen to Explanation ({targetLanguage})
              </p>
              <audio id="explanation-audio" controls src={`${import.meta.env.VITE_API_BASE_URL}${explanation.audio}`} className="w-full h-14 mb-4"></audio>
              <button
                onClick={() => {
                  const audioEl = document.getElementById('explanation-audio');
                  if (audioEl) {
                    audioEl.playbackRate = audioEl.playbackRate === 1.0 ? 0.75 : 1.0;
                    alert(audioEl.playbackRate === 0.75 ? "Speech slowed down for better clarity." : "Speech returned to normal speed.");
                  }
                }}
                className={`bg-white border-2 border-[#0F766E] text-[#0F766E] font-bold py-3 px-7 min-h-[44px] rounded-full shadow-sm hover:bg-[#0F766E] hover:text-white hover:scale-105 transition-all duration-300 ${focusRing}`}
              >
                🐢 Toggle Slow Speech
              </button>
            </div>
          )}

          <div className="bg-[#F8FAFC] p-6 rounded-2xl ring-1 ring-slate-200 text-[#17324D] text-lg leading-relaxed whitespace-pre-line">
            {explanation.summary}
          </div>
          <div className="mt-6 p-4 bg-amber-50 text-amber-900 text-sm rounded-xl border border-amber-300">
            <strong>Disclaimer:</strong> This AI-generated explanation is for educational purposes only. Always consult your doctor.
          </div>
        </div>
      )}

      {/* 4. DOCTOR PREPARATION KIT */}
      {explanation && !doctorQuestions && (
        <button onClick={handleDoctorPrep} className={`bg-[#17324D] text-white font-bold text-lg py-4 px-6 min-h-[56px] rounded-xl hover:bg-[#0F2438] hover:scale-[1.02] active:scale-100 transition-all duration-300 w-full max-w-3xl shadow-lg hover:shadow-xl ${focusRing}`}>
          Prepare Questions for My Doctor
        </button>
      )}
      {doctorQuestions && (
        <div className={`${card} max-w-3xl shadow-lg border-l-8 border-l-[#17324D]`}>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#17324D] mb-6">Questions for Your Doctor</h2>
          <div className="bg-[#F8FAFC] p-6 rounded-2xl ring-1 ring-slate-200 text-[#17324D] text-lg leading-relaxed whitespace-pre-line">{doctorQuestions}</div>
        </div>
      )}

      {/* 5. FOLLOW-UP CHAT */}
      {explanation && (
        <div className={`${card} max-w-3xl shadow-lg border-t-8 border-t-[#0F766E]`}>
          <h2 className="text-2xl font-extrabold tracking-tight text-[#17324D] mb-6">Ask a Question</h2>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-6">
            <input
              type="text"
              value={chatQuestion}
              onChange={(e) => setChatQuestion(e.target.value)}
              placeholder="e.g., What does the Hemoglobin reference range mean?"
              aria-label="Your question"
              className={`flex-1 border border-slate-300 p-3.5 rounded-xl text-lg bg-slate-50 text-[#17324D] placeholder:text-slate-400 transition-all duration-300 focus:border-[#0F766E] focus:bg-white ${focusRing}`}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={startListening}
                title="Speak your question"
                aria-label="Speak your question"
                className={`flex items-center justify-center w-14 h-14 rounded-full transition-all duration-300 shadow-md hover:scale-105 ${focusRing} ${isListening ? 'bg-red-600 text-white animate-pulse motion-reduce:animate-none' : 'bg-white border-2 border-slate-300 text-[#0F766E] hover:bg-[#DDF5EF]'}`}
              >
                <MicIcon />
              </button>
              <button onClick={handleAskQuestion} disabled={isChatting} className={`flex-1 sm:flex-none bg-[#0F766E] text-white font-bold text-lg h-14 px-8 rounded-xl hover:bg-[#0B5F59] hover:scale-105 active:scale-100 transition-all duration-300 disabled:bg-slate-400 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-lg ${focusRing}`}>
                {isChatting ? 'Thinking...' : 'Ask'}
              </button>
            </div>
          </div>
          {chatAnswer && (
            <div className="bg-[#DDF5EF]/60 p-6 rounded-2xl text-[#17324D] text-lg leading-relaxed border border-[#0F766E]/20 whitespace-pre-line">
              <span className="font-bold text-[#0F766E]">AI Assistant:</span> <br/>{chatAnswer}
            </div>
          )}
        </div>
      )}

    </div>
  );
}