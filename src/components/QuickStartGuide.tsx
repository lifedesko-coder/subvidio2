import React from "react";
import { CheckCircle2, Terminal, Zap, ShieldCheck, Cpu, Code2, ArrowRight } from "lucide-react";

export const QuickStartGuide: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Intro Card */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Zap size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Lightweight Architecture & Execution Guide
            </h2>
            <p className="text-xs text-slate-400">
              Built specifically to avoid heavy system dependencies or standalone FFmpeg installations.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <Cpu size={16} />
              <span>1. Lightweight Audio</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Uses <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">moviepy</code> with bundled pre-compiled <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">imageio-ffmpeg</code>. Pure Python installation with zero system-level package managers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <ShieldCheck size={16} />
              <span>2. Timestamped ASR</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              API-driven Whisper (<code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">whisper-1</code>) or Gemini ASR. Transcribes Hindi speech into millisecond-accurate start/end speech intervals.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
            <div className="flex items-center gap-2 text-amber-400 text-sm font-semibold mb-1">
              <Code2 size={16} />
              <span>3. Contextual Arabic Subtitling</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Translates to natural Modern Standard Arabic (الفصحى) or regional dialects with conciseness tuned for video subtitle readability.
            </p>
          </div>
        </div>
      </div>

      {/* Step by step Terminal setup */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
        <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
          <Terminal className="text-amber-400" size={18} />
          <span>Running Locally in 3 Steps</span>
        </h3>

        <div className="space-y-4 text-xs">
          {/* Step 1 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">
                1
              </span>
              <span>Create virtual environment & activate</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 overflow-x-auto">
              python3 -m venv venv{"\n"}
              source venv/bin/activate  <span className="text-slate-500"># On Windows use: venv\Scripts\activate</span>
            </div>
          </div>

          {/* Step 2 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">
                2
              </span>
              <span>Install minimal dependencies & configure API key</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-slate-300 overflow-x-auto">
              pip install -r requirements.txt{"\n"}
              cp .env.example .env  <span className="text-slate-500"># Paste your OPENAI_API_KEY or GEMINI_API_KEY</span>
            </div>
          </div>

          {/* Step 3 */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center text-[11px]">
                3
              </span>
              <span>Launch Streamlit Web App</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 font-mono text-amber-300 overflow-x-auto">
              streamlit run app.py
            </div>
            <p className="text-slate-400 text-[11px] pt-1">
              Streamlit will launch and open your browser at <span className="text-amber-400 font-mono">http://localhost:8501</span>.
            </p>
          </div>
        </div>
      </div>

      {/* Subtitle SRT Specification */}
      <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-6 shadow-xl">
        <h3 className="text-base font-bold text-slate-100 mb-2">
          SRT Output Format Specification
        </h3>
        <p className="text-xs text-slate-400 mb-3">
          The generated <code className="text-amber-300 bg-slate-950 px-1 py-0.5 rounded">.srt</code> file is fully compatible with VLC, YouTube, Adobe Premiere, Final Cut Pro, DaVinci Resolve, and all modern media players:
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2">
          <div className="text-amber-400/90 font-bold">1</div>
          <div className="text-slate-400">00:00:01,200 --&gt; 00:00:04,500</div>
          <div className="text-amber-300 font-sans text-sm text-right" dir="rtl">
            مرحبًا بكم في هذا الدرس، اليوم سنتعلم التقنيات الجديدة.
          </div>
          <div className="text-slate-500 pt-2 font-bold text-amber-400/90">2</div>
          <div className="text-slate-400">00:00:04,800 --&gt; 00:00:08,100</div>
          <div className="text-amber-300 font-sans text-sm text-right" dir="rtl">
            يمكنك تحميل ملفات الترجمة واستخدامها مباشرة مع الفيديو.
          </div>
        </div>
      </div>
    </div>
  );
};
