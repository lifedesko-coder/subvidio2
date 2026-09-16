import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Eye, EyeOff } from "lucide-react";
import { SubtitleSegment } from "../types";

interface VideoPlayerWithSubtitlesProps {
  videoSrc: string;
  segments: SubtitleSegment[];
  currentTime: number;
  onTimeUpdate: (time: number) => void;
  showHindiSub: boolean;
  onToggleHindiSub: () => void;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}

export const VideoPlayerWithSubtitles: React.FC<VideoPlayerWithSubtitlesProps> = ({
  videoSrc,
  segments,
  currentTime,
  onTimeUpdate,
  showHindiSub,
  onToggleHindiSub,
  videoRef,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(true);
  const [duration, setDuration] = useState(0);

  // Find currently active segment
  const activeSegment = segments.find(
    (seg) => currentTime >= seg.start && currentTime <= seg.end
  );

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !videoRef.current.muted;
    setIsMuted(videoRef.current.muted);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      onTimeUpdate(time);
    }
  };

  const formatTimeDisplay = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins}:${s < 10 ? "0" : ""}${s}`;
  };

  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    setLoadError(false);
  }, [videoSrc]);

  return (
    <div className="relative rounded-2xl overflow-hidden bg-slate-950 shadow-xl border border-slate-800">
      {/* Video element */}
      <div className="relative aspect-video flex items-center justify-center bg-black">
        {videoSrc ? (
          <video
            ref={videoRef}
            src={videoSrc}
            className="w-full h-full object-contain"
            onTimeUpdate={(e) => onTimeUpdate(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => {
              setDuration(e.currentTarget.duration);
              setLoadError(false);
            }}
            onError={() => setLoadError(true)}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            playsInline
            controls={false}
          />
        ) : (
          <div className="text-center p-6 text-slate-400">
            <p className="text-sm">لا يوجد فيديو محمل حالياً</p>
            <p className="text-xs text-slate-500 mt-1">اختر نموذجاً من الأعلى أو ارفع ملف فيديو</p>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center z-10">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center mb-3">
              <Play size={24} />
            </div>
            <p className="text-sm font-semibold text-slate-200">
              جاري تشغيل المعاينة التفاعلية للترجمة
            </p>
            <p className="text-xs text-slate-400 max-w-sm mt-1">
              يمكنك استخدام محاكي التوقيت أدناه لتشغيل ومزامنة الترجمة العربية مباشرة، أو رفع أي ملف فيديو محلي من جهازك.
            </p>
          </div>
        )}

        {/* Subtitle Overlay */}
        {showSubtitles && activeSegment && (
          <div className="absolute bottom-16 left-4 right-4 flex flex-col items-center pointer-events-none transition-all duration-150">
            <div className="bg-black/85 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 shadow-2xl max-w-2xl text-center">
              {/* Arabic Subtitle */}
              <p
                dir="rtl"
                className="text-amber-300 font-semibold text-lg md:text-xl leading-relaxed tracking-wide font-sans drop-shadow"
              >
                {activeSegment.arabicText}
              </p>

              {/* Hindi Original (Optional subtitle) */}
              {showHindiSub && activeSegment.hindiText && (
                <p className="text-slate-300 text-xs md:text-sm mt-1 border-t border-white/10 pt-1 font-sans opacity-85">
                  {activeSegment.hindiText}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modern Video Controls Bar */}
      <div className="bg-slate-900/95 border-t border-slate-800/80 px-4 py-3 flex flex-col gap-2">
        {/* Progress Slider */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400 font-mono w-10">
            {formatTimeDisplay(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <span className="text-xs text-slate-400 font-mono w-10 text-right">
            {formatTimeDisplay(duration)}
          </span>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              id="video-play-toggle-btn"
              onClick={togglePlay}
              className="p-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-medium transition cursor-pointer flex items-center justify-center"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="translate-x-0.5" />}
            </button>

            <button
              id="video-restart-btn"
              onClick={() => {
                if (videoRef.current) {
                  videoRef.current.currentTime = 0;
                  videoRef.current.play();
                }
              }}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              title="Restart Video"
            >
              <RotateCcw size={16} />
            </button>

            <button
              id="video-mute-toggle-btn"
              onClick={toggleMute}
              className="p-2 rounded-lg text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="toggle-subtitles-btn"
              onClick={() => setShowSubtitles(!showSubtitles)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                showSubtitles
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
              title="Toggle Subtitle Overlay"
            >
              {showSubtitles ? <Eye size={14} /> : <EyeOff size={14} />}
              <span>Arabic Subs</span>
            </button>

            <button
              id="toggle-hindi-secondary-btn"
              onClick={onToggleHindiSub}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition cursor-pointer ${
                showHindiSub
                  ? "bg-slate-700 text-slate-200 border border-slate-600"
                  : "bg-slate-800/60 text-slate-400 hover:text-slate-300"
              }`}
              title="Show Hindi source text under Arabic subtitle"
            >
              <span>+ Hindi Source</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
