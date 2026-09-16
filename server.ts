import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize GoogleGenAI client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

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

function buildSrt(segments: Array<{ start: number; end: number; arabicText: string }>): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.arabicText.trim()}\n`;
    })
    .join("\n");
}

function buildBilingualSrt(segments: Array<{ start: number; end: number; arabicText: string; hindiText: string }>): string {
  return segments
    .map((seg, i) => {
      const start = formatSrtTime(seg.start);
      const end = formatSrtTime(seg.end);
      return `${i + 1}\n${start} --> ${end}\n${seg.arabicText.trim()}\n(${seg.hindiText.trim()})\n`;
    })
    .join("\n");
}

// 1. Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 2. Python Codebase API (exposes python_app files for viewing & 1-click zip export)
app.get("/api/python-project", (req, res) => {
  try {
    const pythonDir = path.join(process.cwd(), "python_app");
    const fileNames = ["app.py", "translator_core.py", "requirements.txt", "README.md", ".env.example"];
    const files = [];

    for (const name of fileNames) {
      const filePath = path.join(pythonDir, name);
      if (fs.existsSync(filePath)) {
        files.push({
          name,
          path: `python_app/${name}`,
          content: fs.readFileSync(filePath, "utf-8"),
        });
      }
    }

    res.json({ success: true, files });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. Preset sample video clips & transcripts for testing
const SAMPLE_VIDEOS = [
  {
    id: "sample_tech_hindi",
    title: "AI & Future Technology (Hindi Tech Talk)",
    duration: 18,
    category: "Technology",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    sampleSegments: [
      {
        id: 1,
        start: 0.0,
        end: 3.5,
        hindiText: "नमस्ते दोस्तों, आज हम कृत्रिम बुद्धिमत्ता के भविष्य के बारे में बात करेंगे।",
        arabicText: "مرحبًا بكم أصدقائي، اليوم سنتحدث عن مستقبل الذكاء الاصطناعي.",
      },
      {
        id: 2,
        start: 3.8,
        end: 7.2,
        hindiText: "यह तकनीक हमारे दैनिक जीवन और काम करने के तरीके को पूरी तरह बदल रही है।",
        arabicText: "هذه التكنولوجيا تغيّر حياتنا اليومية وأسلوب عملنا بالكامل.",
      },
      {
        id: 3,
        start: 7.5,
        end: 12.0,
        hindiText: "मशीन लर्निंग और न्यूरल नेटवर्क की सहायता से हम जटिल समस्याओं को आसानी से हल कर सकते हैं।",
        arabicText: "بمساعدة التعلم الآلي والشبكات العصبية، يمكننا حل المشكلات المعقدة بسهولة.",
      },
      {
        id: 4,
        start: 12.3,
        end: 17.5,
        hindiText: "आइए देखें कि यह आने वाले वर्षों में कैसे विकसित होगा।",
        arabicText: "دعونا نرى كيف سيتطور هذا في السنوات القادمة.",
      },
    ],
  },
  {
    id: "sample_travel_hindi",
    title: "Incredible India Heritage (Hindi Travelogue)",
    duration: 15,
    category: "Travel & Culture",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    sampleSegments: [
      {
        id: 1,
        start: 0.0,
        end: 4.0,
        hindiText: "भारत की संस्कृति और इतिहास सदियों पुरानी और बेहद समृद्ध है।",
        arabicText: "ثقافة الهند وتاريخها عريقان للغاية ويمتدان لقرون طويلة.",
      },
      {
        id: 2,
        start: 4.2,
        end: 8.5,
        hindiText: "हर राज्य की अपनी अनूठी भाषा, वेशभूषा और स्वादिष्ट व्यंजन हैं।",
        arabicText: "لكل ولاية لغتها الفريدة وأزياؤها وأطباقها الشهية الخاصة.",
      },
      {
        id: 3,
        start: 8.8,
        end: 14.2,
        hindiText: "यह विविधता ही हमारे देश की सबसे खूबसूरत पहचान बनाती है।",
        arabicText: "هذا التنوع هو ما يشكّل أجمل هوية لبلادنا.",
      },
    ],
  },
];

app.get("/api/samples", (req, res) => {
  res.json({ samples: SAMPLE_VIDEOS });
});

// 4. Video Translation & SRT Generation API (Powered by Gemini)
app.post("/api/translate-video", async (req, res) => {
  try {
    const {
      mediaBase64,
      mimeType = "video/mp4",
      hindiText,
      dialect = "Modern Standard Arabic (الفصحى)",
      sampleId,
    } = req.body;

    // Quick path: If sampleId is provided and no custom audio
    if (sampleId && !mediaBase64 && !hindiText) {
      const found = SAMPLE_VIDEOS.find((s) => s.id === sampleId);
      if (found) {
        const segs = found.sampleSegments.map((s) => ({
          ...s,
          startTime: formatSrtTime(s.start),
          endTime: formatSrtTime(s.end),
        }));
        return res.json({
          success: true,
          segments: segs,
          srt: buildSrt(segs),
          bilingualSrt: buildBilingualSrt(segs),
        });
      }
    }

    // System prompt for high-precision ASR & Arabic Translation
    const systemPrompt = `You are a professional Hindi-to-Arabic subtitler and audio translator.
Your goal is to transcribe spoken Hindi audio/video with precise timestamps (in seconds), and translate each sentence into natural, context-aware ${dialect}.

Subtitling Rules:
1. Break subtitles into logical, readable speech segments (typically 2 to 6 seconds each).
2. For each segment, provide:
   - "start": start time in seconds (float, e.g. 1.25)
   - "end": end time in seconds (float, e.g. 4.80)
   - "hindiText": accurate transcription of the Hindi spoken words in Devanagari script.
   - "arabicText": natural, fluent, and idiomatic translation in ${dialect}. Keep it screen-readable and concise.
3. Ensure timestamps are sequential and non-overlapping.
4. Return ONLY a valid JSON object with a "segments" array.`;

    let promptContents: any;

    if (mediaBase64) {
      // Clean base64 string
      const cleanBase64 = mediaBase64.replace(/^data:[^;]+;base64,/, "");
      promptContents = {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: `Please transcribe the Hindi speech in this media file with precise start/end timestamps in seconds, and translate each segment into natural ${dialect} for SRT subtitles.`,
          },
        ],
      };
    } else if (hindiText) {
      // Transcript provided: synthesize timing and translate
      promptContents = {
        parts: [
          {
            text: `Here is a Hindi transcript. Segment it into natural conversational subtitle units with estimated timestamps (spaced roughly 3-5 seconds per sentence) and provide fluent ${dialect} translation:
\n${hindiText}`,
          },
        ],
      };
    } else {
      return res.status(400).json({ error: "Please provide media file or text transcript." });
    }

    // Helper to generate content with fallback across available models and retry on temporary 503 high-demand spikes
    const candidateModels = ["gemini-3.1-flash-lite", "gemini-3.8-flash", "gemini-flash-latest"];
    let responseText = "";
    let usedModel = "";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      // Try up to 2 attempts per model with exponential backoff if 503/UNAVAILABLE occurs
      for (let attempt = 1; attempt <= 2; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptContents,
            config: {
              systemInstruction: systemPrompt,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  segments: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.INTEGER },
                        start: { type: Type.NUMBER },
                        end: { type: Type.NUMBER },
                        hindiText: { type: Type.STRING },
                        arabicText: { type: Type.STRING },
                      },
                      required: ["start", "end", "hindiText", "arabicText"],
                    },
                  },
                },
                required: ["segments"],
              },
            },
          });

          if (response.text) {
            responseText = response.text.trim();
            usedModel = modelName;
            break;
          }
        } catch (callErr: any) {
          lastError = callErr;
          console.warn(`Model attempt failed [${modelName} - attempt ${attempt}]:`, callErr.message || callErr);
          const isRateOrDemand =
            callErr?.status === 503 ||
            callErr?.status === "UNAVAILABLE" ||
            callErr?.message?.includes("503") ||
            callErr?.message?.includes("high demand") ||
            callErr?.message?.includes("RESOURCE_EXHAUSTED");

          if (isRateOrDemand && attempt < 2) {
            // Wait 1.2 seconds before retrying
            await new Promise((resolve) => setTimeout(resolve, 1200));
            continue;
          }
          // If not retryable or attempt 2, advance to next model in cascade
          break;
        }
      }

      if (responseText) {
        break;
      }
    }

    if (!responseText) {
      throw lastError || new Error("All transcription and translation models are currently busy. Please retry in a few moments.");
    }

    let parsed: any;
    try {
      parsed = JSON.parse(responseText);
    } catch {
      // Fallback regex extract
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : { segments: [] };
    }

    let rawSegments = parsed.segments || [];
    if (!Array.isArray(rawSegments) && typeof parsed === "object") {
      const firstArray = Object.values(parsed).find((v) => Array.isArray(v));
      if (firstArray) rawSegments = firstArray;
    }

    const formattedSegments = (rawSegments as any[]).map((seg, i) => {
      const start = typeof seg.start === "number" ? Math.max(0, seg.start) : i * 3.0;
      const end = typeof seg.end === "number" ? Math.max(start + 0.5, seg.end) : start + 3.0;
      return {
        id: seg.id || i + 1,
        start,
        end,
        startTime: formatSrtTime(start),
        endTime: formatSrtTime(end),
        hindiText: seg.hindiText || "",
        arabicText: seg.arabicText || "",
      };
    });

    const srt = buildSrt(formattedSegments);
    const bilingualSrt = buildBilingualSrt(formattedSegments);

    res.json({
      success: true,
      segments: formattedSegments,
      srt,
      bilingualSrt,
      modelUsed: usedModel,
    });
  } catch (err: any) {
    console.error("Translation API Error:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to transcribe and translate media.",
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Hindi-to-Arabic Video Translator server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
