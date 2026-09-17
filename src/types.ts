export interface SubtitleSegment {
  id: number;
  start: number;
  end: number;
  startTime: string;
  endTime: string;
  hindiText: string;
  arabicText: string;
  isSong?: boolean;
}

export interface SampleVideo {
  id: string;
  title: string;
  duration: number;
  category: string;
  videoUrl: string;
  sampleSegments: SubtitleSegment[];
}

export interface PythonFile {
  name: string;
  path: string;
  content: string;
}

export type ArabicDialect =
  | "Modern Standard Arabic (الفصحى)"
  | "Egyptian Arabic (اللهجة المصرية)"
  | "Gulf Arabic (اللهجة الخليجية)"
  | "Levantine Arabic (اللهجة الشامية)";

export type AppTab = "translator" | "codebase" | "guide";
