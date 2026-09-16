import React, { useState } from "react";
import { Download, Copy, Check, FileCode, FolderArchive, Terminal, Sparkles, BookOpen } from "lucide-react";
import JSZip from "jszip";
import { PythonFile } from "../types";

interface PythonCodeViewerProps {
  files: PythonFile[];
}

export const PythonCodeViewer: React.FC<PythonCodeViewerProps> = ({ files }) => {
  const [selectedFileName, setSelectedFileName] = useState<string>("app.py");
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile = files.find((f) => f.name === selectedFileName) || files[0];

  const handleCopy = () => {
    if (!currentFile) return;
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadSingleFile = (file: PythonFile) => {
    const blob = new Blob([file.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadZip = async () => {
    if (files.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const folder = zip.folder("hindi_arabic_video_translator");

      files.forEach((file) => {
        if (folder) {
          folder.file(file.name, file.content);
        }
      });

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "hindi_arabic_video_translator_python.zip";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Zip generation error:", err);
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-950/40 via-slate-900 to-slate-900 p-5 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Sparkles size={12} /> Pure Python & Streamlit Codebase
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-100">
            Lightweight Python Application Source
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Zero standalone FFmpeg dependency • Whisper ASR • Contextual LLM Arabic Translation • Clean Streamlit UI
          </p>
        </div>

        <button
          id="download-full-python-zip-btn"
          onClick={handleDownloadZip}
          disabled={isZipping || files.length === 0}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition cursor-pointer self-start md:self-auto disabled:opacity-50"
        >
          <FolderArchive size={16} />
          <span>{isZipping ? "Creating Zip..." : "Download Full Project (.zip)"}</span>
        </button>
      </div>

      {/* Main Code View: Left File List + Right Code Editor */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
        {/* Left Files List */}
        <div className="p-4 space-y-1.5 bg-slate-950/40">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 px-2 flex items-center gap-1.5">
            <FileCode size={14} className="text-amber-400" />
            <span>Files Included</span>
          </div>

          {files.map((file) => {
            const isSelected = file.name === selectedFileName;
            return (
              <button
                key={file.name}
                id={`select-file-${file.name.replace(".", "-")}`}
                onClick={() => setSelectedFileName(file.name)}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-mono flex items-center justify-between transition cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/30 font-semibold"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-slate-100"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="text-amber-400/80">📄</span>
                  <span className="truncate">{file.name}</span>
                </div>
                <span className="text-[10px] text-slate-400 opacity-60">
                  {file.name.endsWith(".py") ? "Python" : file.name.endsWith(".md") ? "Markdown" : "Config"}
                </span>
              </button>
            );
          })}

          <div className="pt-4 mt-4 border-t border-slate-800/80 px-2 space-y-2 text-[11px] text-slate-400">
            <div className="font-semibold text-slate-300 flex items-center gap-1">
              <Terminal size={12} className="text-amber-400" /> Quick Run
            </div>
            <pre className="p-2 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-amber-300 overflow-x-auto">
              pip install -r requirements.txt{"\n"}
              streamlit run app.py
            </pre>
          </div>
        </div>

        {/* Right Code Display */}
        <div className="lg:col-span-3 flex flex-col h-[560px] bg-slate-950">
          {/* File Toolbar */}
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/80 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
              <span className="text-amber-400 font-bold">{currentFile?.name}</span>
              <span className="text-slate-400 text-[11px]">
                ({currentFile?.content.split("\n").length} lines)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                id="copy-code-btn"
                onClick={handleCopy}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                title="Copy code to clipboard"
              >
                {copied ? (
                  <>
                    <Check size={13} className="text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={13} />
                    <span>Copy</span>
                  </>
                )}
              </button>

              {currentFile && (
                <button
                  id={`download-file-${currentFile.name.replace(".", "-")}`}
                  onClick={() => handleDownloadSingleFile(currentFile)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
                  title="Download this file"
                >
                  <Download size={13} />
                  <span>Download File</span>
                </button>
              )}
            </div>
          </div>

          {/* Code Body */}
          <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-200 leading-relaxed bg-[#0b0f19]">
            <pre className="whitespace-pre overflow-x-auto selection:bg-amber-500/30">
              {currentFile?.content}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
