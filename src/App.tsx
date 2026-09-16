import React, { useState, useEffect, useRef } from "react";
import {
  Video,
  FileCode,
  BookOpen,
  UploadCloud,
  Download,
  Copy,
  Check,
  Play,
  RotateCcw,
  Sparkles,
  Sliders,
  Globe,
  FileText,
  AlertCircle,
  Film,
} from "lucide-react";
import { VideoPlayerWithSubtitles } from "./components/VideoPlayerWithSubtitles";
import { SubtitleEditor } from "./components/SubtitleEditor";
import { PythonCodeViewer } from "./components/PythonCodeViewer";
import { QuickStartGuide } from "./components/QuickStartGuide";
import { SubtitleSegment, SampleVideo, PythonFile, ArabicDialect, AppTab } from "./types";

export default function App() {
  const [currentTab, setCurrentTab] = useState<AppTab>("translator");
  const [samples, setSamples] = useState<SampleVideo[]>([]);
  const [selectedSampleId, setSelectedSampleId] = useState<string>("");
  const [pythonFiles, setPythonFiles] = useState<PythonFile[]>([]);
  
  // Video and translation states
  const [videoSrc, setVideoSrc] = useState<string>("");
  const [videoFileName, setVideoFileName] = useState<string>("hindi_video.mp4");
  const [mediaBase64, setMediaBase64] = useState<string>("");
  const [mimeType, setMimeType] = useState<string>("video/mp4");
  
  const [dialect, setDialect] = useState<ArabicDialect>("Modern Standard Arabic (الفصحى)");
  const [segments, setSegments] = useState<SubtitleSegment[]>([]);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [showHindiSub, setShowHindiSub] = useState<boolean>(true);
  
  // Progress states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressStep, setProgressStep] = useState<number>(0);
  const [progressStatus, setProgressStatus] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [copiedSrt, setCopiedSrt] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Load samples and Python project code on startup
  useEffect(() => {
    fetch("/api/samples")
      .then((res) => res.json())
      .then((data) => {
        if (data.samples && data.samples.length > 0) {
          setSamples(data.samples);
          // Preload first sample
          loadSampleVideo(data.samples[0]);
        }
      })
      .catch((err) => console.error("Failed to load sample videos:", err));

    fetch("/api/python-project")
      .then((res) => res.json())
      .then((data) => {
        if (data.files) {
          setPythonFiles(data.files);
        }
      })
      .catch((err) => console.error("Failed to load python project:", err));
  }, []);

  const loadSampleVideo = (sample: SampleVideo) => {
    setSelectedSampleId(sample.id);
    setVideoSrc(sample.videoUrl);
    setVideoFileName(`${sample.id}.mp4`);
    setMediaBase64("");
    setSegments(sample.sampleSegments);
    setCurrentTime(0);
    setErrorMsg("");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 40 * 1024 * 1024) {
      setErrorMsg("File size exceeds 40MB limit for live preview. Please select a smaller clip or use the local Python Streamlit app for unlimited sizes.");
      return;
    }

    setErrorMsg("");
    setSelectedSampleId("");
    setVideoFileName(file.name);
    setMimeType(file.type || "video/mp4");

    const objectUrl = URL.createObjectURL(file);
    setVideoSrc(objectUrl);

    // Read base64 for API
    const reader = new FileReader();
    reader.onload = () => {
      setMediaBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.size > 40 * 1024 * 1024) {
        setErrorMsg("File size exceeds 40MB. For large media files, please run the included Python Streamlit application locally.");
        return;
      }
      setErrorMsg("");
      setSelectedSampleId("");
      setVideoFileName(file.name);
      setMimeType(file.type || "video/mp4");
      setVideoSrc(URL.createObjectURL(file));

      const reader = new FileReader();
      reader.onload = () => {
        setMediaBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Run Translation pipeline via Express API & Gemini
  const handleStartTranslation = async () => {
    setIsProcessing(true);
    setErrorMsg("");
    setProgressStep(15);
    setProgressStatus("Step 1/4: Extracting audio track...");

    try {
      setTimeout(() => {
        setProgressStep(40);
        setProgressStatus("Step 2/4: Transcribing Hindi speech (ASR timestamps)...");
      }, 700);

      setTimeout(() => {
        setProgressStep(70);
        setProgressStatus(`Step 3/4: Generating context-aware translation in ${dialect}...`);
      }, 1600);

      const payload: any = {
        dialect,
      };

      if (mediaBase64) {
        payload.mediaBase64 = mediaBase64;
        payload.mimeType = mimeType;
      } else if (selectedSampleId) {
        payload.sampleId = selectedSampleId;
      } else {
        throw new Error("Please upload a video or choose a sample.");
      }

      const res = await fetch("/api/translate-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Translation processing failed.");
      }

      setProgressStep(95);
      setProgressStatus("Step 4/4: Formatting and synchronizing SRT subtitle cues...");

      setTimeout(() => {
        setSegments(data.segments);
        setProgressStep(100);
        setProgressStatus("Subtitles generated successfully!");
        setIsProcessing(false);
      }, 400);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred during processing.");
      setIsProcessing(false);
    }
  };

  // Subtitle management functions
  const handleSelectSegment = (startTime: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      videoRef.current.play();
    }
    setCurrentTime(startTime);
  };

  const handleUpdateSegment = (updated: SubtitleSegment) => {
    setSegments((prev) =>
      prev.map((s) => (s.id === updated.id ? updated : s))
    );
  };

  const handleDeleteSegment = (id: number) => {
    setSegments((prev) => prev.filter((s) => s.id !== id));
  };

  const handleAddSegment = () => {
    const lastSeg = segments[segments.length - 1];
    const newStart = lastSeg ? lastSeg.end + 0.5 : currentTime;
    const newEnd = newStart + 3.0;
    const newId = segments.length ? Math.max(...segments.map((s) => s.id)) + 1 : 1;

    const newSegment: SubtitleSegment = {
      id: newId,
      start: newStart,
      end: newEnd,
      startTime: formatSrtTime(newStart),
      endTime: formatSrtTime(newEnd),
      hindiText: "नया संवाद",
      arabicText: "نص ترجمة جديد",
    };
    setSegments((prev) => [...prev, newSegment]);
  };

  function formatSrtTime(seconds: number): string {
    const totalMs = Math.round(seconds * 1000);
    const ms = totalMs % 1000;
    const totalSecs = Math.floor(totalMs / 1000);
    const secs = totalSecs % 60;
    const totalMins = Math.floor(totalSecs / 60);
    const mins = totalMins % 60;
    const hours = Math.floor(totalMins / 60);

    const pad = (n: number, z = 2) => String(n).padStart(z, "0");
    return `${pad(hours)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
  }

  // Generate SRT strings
  const getArabicSrt = () => {
    return segments
      .map((seg, i) => {
        const start = formatSrtTime(seg.start);
        const end = formatSrtTime(seg.end);
        return `${i + 1}\n${start} --> ${end}\n${seg.arabicText.trim()}\n`;
      })
      .join("\n");
  };

  const getBilingualSrt = () => {
    return segments
      .map((seg, i) => {
        const start = formatSrtTime(seg.start);
        const end = formatSrtTime(seg.end);
        return `${i + 1}\n${start} --> ${end}\n${seg.arabicText.trim()}\n(${seg.hindiText.trim()})\n`;
      })
      .join("\n");
  };

  const getVtt = () => {
    const srt = getArabicSrt();
    return "WEBVTT\n\n" + srt.replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, "$1.$2");
  };

  const downloadFile = (content: string, filename: string, type = "text/plain;charset=utf-8") => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copySrtToClipboard = () => {
    navigator.clipboard.writeText(getArabicSrt());
    setCopiedSrt(true);
    setTimeout(() => setCopiedSrt(false), 2000);
  };

  const baseFileName = videoFileName.replace(/\.[^/.]+$/, "");

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Film size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-100">
                  Hindi to Arabic Video Translator
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  SRT Generator
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Lightweight audio extraction • Accurate ASR timestamps • Natural Arabic subtitling
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              id="nav-tab-translator"
              onClick={() => setCurrentTab("translator")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                currentTab === "translator"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <Video size={14} />
              <span>Live Translator</span>
            </button>

            <button
              id="nav-tab-codebase"
              onClick={() => setCurrentTab("codebase")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                currentTab === "codebase"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <FileCode size={14} />
              <span>Python Codebase</span>
            </button>

            <button
              id="nav-tab-guide"
              onClick={() => setCurrentTab("guide")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                currentTab === "guide"
                  ? "bg-amber-500 text-slate-950 font-semibold shadow"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }`}
            >
              <BookOpen size={14} />
              <span>Execution Guide</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentTab === "translator" && (
          <div className="space-y-6">
            {/* Controls Bar: Upload & Samples & Dialect */}
            <div className="bg-slate-900/80 rounded-2xl border border-slate-800 p-4 sm:p-5 shadow-lg space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Left: Sample Clips or File Upload Indicator */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mr-1">
                    Try Sample:
                  </span>
                  {samples.map((s) => (
                    <button
                      key={s.id}
                      id={`sample-btn-${s.id}`}
                      onClick={() => loadSampleVideo(s)}
                      className={`text-xs px-3 py-1.5 rounded-xl border transition cursor-pointer flex items-center gap-1.5 ${
                        selectedSampleId === s.id
                          ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-medium"
                          : "bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800"
                      }`}
                    >
                      <Sparkles size={12} className="text-amber-400" />
                      <span>{s.title}</span>
                    </button>
                  ))}
                </div>

                {/* Right: Dialect Selection */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
                    <Globe size={14} className="text-amber-400" />
                    <span>Arabic Subtitle Dialect:</span>
                  </div>
                  <select
                    id="dialect-select"
                    value={dialect}
                    onChange={(e) => setDialect(e.target.value as ArabicDialect)}
                    className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="Modern Standard Arabic (الفصحى)">Modern Standard Arabic (الفصحى)</option>
                    <option value="Egyptian Arabic (اللهجة المصرية)">Egyptian (اللهجة المصرية)</option>
                    <option value="Gulf Arabic (اللهجة الخليجية)">Gulf (اللهجة الخليجية)</option>
                    <option value="Levantine Arabic (اللهجة الشامية)">Levantine (اللهجة الشامية)</option>
                  </select>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                className="border-2 border-dashed border-slate-700 hover:border-amber-500/60 rounded-xl p-4 transition text-center bg-slate-950/30 flex flex-col sm:flex-row items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-800/80 flex items-center justify-center text-amber-400 shrink-0">
                    <UploadCloud size={20} />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-slate-200">
                      Upload any Video with Hindi Speech (MP4, MKV, MOV, WebM)
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Currently loaded: <span className="text-amber-400 font-mono">{videoFileName}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <label
                    htmlFor="video-file-input"
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold cursor-pointer transition text-center"
                  >
                    Browse Local File
                  </label>
                  <input
                    id="video-file-input"
                    type="file"
                    accept="video/*,audio/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />

                  <button
                    id="start-translate-btn"
                    onClick={handleStartTranslation}
                    disabled={isProcessing}
                    className="w-full sm:w-auto px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={14} />
                        <span>Translate to Arabic SRT</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Progress Feedback Bar */}
              {isProcessing && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-amber-300 font-medium">{progressStatus}</span>
                    <span className="font-mono text-slate-400">{progressStep}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-400 transition-all duration-300 ease-out"
                      style={{ width: `${progressStep}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Error Display */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Main Stage: Player (Left) + Subtitle Editor (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left: Video Player */}
              <div className="lg:col-span-7 space-y-4">
                <VideoPlayerWithSubtitles
                  videoSrc={videoSrc}
                  segments={segments}
                  currentTime={currentTime}
                  onTimeUpdate={(t) => setCurrentTime(t)}
                  showHindiSub={showHindiSub}
                  onToggleHindiSub={() => setShowHindiSub(!showHindiSub)}
                  videoRef={videoRef}
                />

                {/* Subtitle Export Action Bar */}
                <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="text-amber-400" size={18} />
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200">
                        Export Subtitles
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {segments.length} synchronized dialogue cues
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      id="download-arabic-srt-btn"
                      onClick={() => downloadFile(getArabicSrt(), `${baseFileName}_arabic.srt`)}
                      disabled={segments.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md shadow-amber-500/10 disabled:opacity-40"
                    >
                      <Download size={13} />
                      <span>Download .SRT</span>
                    </button>

                    <button
                      id="download-bilingual-srt-btn"
                      onClick={() => downloadFile(getBilingualSrt(), `${baseFileName}_bilingual.srt`)}
                      disabled={segments.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                      title="Download Bilingual SRT (Arabic + Hindi)"
                    >
                      <Download size={13} />
                      <span>Bilingual .SRT</span>
                    </button>

                    <button
                      id="download-vtt-btn"
                      onClick={() => downloadFile(getVtt(), `${baseFileName}_arabic.vtt`)}
                      disabled={segments.length === 0}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs flex items-center gap-1.5 transition cursor-pointer disabled:opacity-40"
                      title="Download WebVTT format"
                    >
                      <Download size={13} />
                      <span>.VTT</span>
                    </button>

                    <button
                      id="copy-srt-btn"
                      onClick={copySrtToClipboard}
                      disabled={segments.length === 0}
                      className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition cursor-pointer disabled:opacity-40"
                      title="Copy SRT text to clipboard"
                    >
                      {copiedSrt ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Subtitle Timeline & Editor */}
              <div className="lg:col-span-5 h-[620px]">
                <SubtitleEditor
                  segments={segments}
                  currentTime={currentTime}
                  onSelectSegment={handleSelectSegment}
                  onUpdateSegment={handleUpdateSegment}
                  onDeleteSegment={handleDeleteSegment}
                  onAddSegment={handleAddSegment}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Python Codebase Viewer */}
        {currentTab === "codebase" && (
          <PythonCodeViewer files={pythonFiles} />
        )}

        {/* Tab 3: Quick Start Guide */}
        {currentTab === "guide" && (
          <QuickStartGuide />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-4 text-center text-xs text-slate-400 bg-slate-950/60">
        <p>
          Hindi to Arabic Video Translator & SRT Subtitle Generator • Designed for lightweight execution without standalone system FFmpeg.
        </p>
      </footer>
    </div>
  );
}
