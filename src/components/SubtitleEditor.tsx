import React, { useState } from "react";
import { Play, Plus, Trash2, Check, Clock, Globe } from "lucide-react";
import { SubtitleSegment } from "../types";

interface SubtitleEditorProps {
  segments: SubtitleSegment[];
  currentTime: number;
  onSelectSegment: (startTime: number) => void;
  onUpdateSegment: (updated: SubtitleSegment) => void;
  onDeleteSegment: (id: number) => void;
  onAddSegment: () => void;
}

export const SubtitleEditor: React.FC<SubtitleEditorProps> = ({
  segments,
  currentTime,
  onSelectSegment,
  onUpdateSegment,
  onDeleteSegment,
  onAddSegment,
}) => {
  const [editingId, setEditingId] = useState<number | null>(null);

  const formatDisplayTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    return `${mins}:${secs.padStart(5, "0")}`;
  };

  return (
    <div className="flex flex-col h-full bg-slate-900/60 rounded-2xl border border-slate-800 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Globe className="text-amber-400" size={18} />
          <h3 className="text-sm font-semibold text-slate-100">
            Subtitle Segments ({segments.length})
          </h3>
        </div>
        <button
          id="add-segment-btn"
          onClick={onAddSegment}
          className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center gap-1.5 transition cursor-pointer"
        >
          <Plus size={14} />
          <span>Add Segment</span>
        </button>
      </div>

      {/* Segments List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[480px]">
        {segments.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            No subtitles yet. Upload a video or choose a sample to generate timed Arabic subtitles.
          </div>
        ) : (
          segments.map((seg, index) => {
            const isActive = currentTime >= seg.start && currentTime <= seg.end;
            const isEditing = editingId === seg.id;

            return (
              <div
                key={seg.id || index}
                id={`subtitle-row-${seg.id}`}
                className={`p-3 rounded-xl border transition-all duration-150 ${
                  isActive
                    ? "bg-amber-950/30 border-amber-500/60 shadow-md ring-1 ring-amber-500/30"
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                {/* Header row: Index & Timestamps */}
                <div className="flex items-center justify-between mb-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-semibold">
                      #{index + 1}
                    </span>
                    <button
                      id={`jump-time-btn-${seg.id}`}
                      onClick={() => onSelectSegment(seg.start)}
                      className="flex items-center gap-1 text-slate-300 hover:text-amber-400 font-mono transition cursor-pointer"
                      title="Jump to start in video"
                    >
                      <Clock size={12} className="text-amber-400" />
                      <span>
                        {formatDisplayTime(seg.start)} ➔ {formatDisplayTime(seg.end)}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      id={`play-segment-btn-${seg.id}`}
                      onClick={() => onSelectSegment(seg.start)}
                      className="p-1 rounded text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Play segment"
                    >
                      <Play size={13} />
                    </button>
                    <button
                      id={`delete-segment-btn-${seg.id}`}
                      onClick={() => onDeleteSegment(seg.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Delete segment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Content: Arabic (Primary) & Hindi (Reference) */}
                <div className="space-y-2">
                  {/* Arabic Text */}
                  <div>
                    <label className="block text-[11px] font-medium text-amber-300/80 mb-1 text-right">
                      الترجمة العربية (Arabic Subtitle)
                    </label>
                    <textarea
                      dir="rtl"
                      rows={2}
                      value={seg.arabicText}
                      onChange={(e) =>
                        onUpdateSegment({ ...seg, arabicText: e.target.value })
                      }
                      className="w-full bg-slate-900/90 border border-slate-700/80 focus:border-amber-500 rounded-lg p-2 text-sm text-slate-100 text-right leading-relaxed font-sans focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                      placeholder="أدخل النص العربي..."
                    />
                  </div>

                  {/* Hindi Source */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Hindi Transcription (मूल हिंदी संवाद)
                    </label>
                    <input
                      type="text"
                      value={seg.hindiText}
                      onChange={(e) =>
                        onUpdateSegment({ ...seg, hindiText: e.target.value })
                      }
                      className="w-full bg-slate-900/60 border border-slate-800 focus:border-slate-600 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 font-sans focus:outline-none"
                      placeholder="Hindi transcription..."
                    />
                  </div>

                  {/* Timestamp Adjustments */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[11px] text-slate-400">
                    <span className="font-mono text-slate-400">
                      Duration: {(seg.end - seg.start).toFixed(2)}s
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          onUpdateSegment({
                            ...seg,
                            start: Math.max(0, seg.start - 0.2),
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                        title="Shift start 0.2s earlier"
                      >
                        -0.2s
                      </button>
                      <button
                        onClick={() =>
                          onUpdateSegment({
                            ...seg,
                            end: seg.end + 0.2,
                          })
                        }
                        className="px-1.5 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                        title="Extend end 0.2s"
                      >
                        +0.2s
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
