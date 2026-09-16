# Hindi to Arabic Video Translator & SRT Subtitle Generator

A modern full-stack web application (React + Vite + Express + Gemini AI) and lightweight Python (Streamlit + Whisper) toolkit designed to transcribe Hindi videos and generate synchronized Arabic SRT subtitles with accurate timestamps.

---

## 🌟 Key Features

1. **Dual Architecture**:
   - **Modern Web App**: React 19, Tailwind CSS, Express backend proxying Gemini AI with automatic model fallback (`gemini-3.1-flash-lite`, `gemini-3.8-flash`, `gemini-flash-latest`).
   - **Lightweight Python Suite (`python_app/`)**: Complete Streamlit app using `moviepy` + `openai` Whisper / Gemini for audio extraction, timestamped transcription, and subtitle translation without requiring external FFmpeg binaries.
2. **Interactive Video & Subtitle Player**:
   - Live Arabic subtitle overlay with synchronized playback.
   - Click-to-seek timestamp navigation.
   - Built-in visual subtitle editor to adjust timings and customize text.
3. **Flexible Export Options**:
   - Standard Arabic `.srt`
   - Bilingual `.srt` (Arabic + Hindi)
   - WebVTT format (`.vtt`)
   - One-click copy or direct file download.

---

## 🚀 Running the Web Application (Node.js)

### 1. Prerequisites
- Node.js 18+ (Node 20+ recommended)
- npm or pnpm

### 2. Installation
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file from `.env.example`:
```bash
cp .env.example .env
```
Provide your Google Gemini API key:
```env
GEMINI_API_KEY="your-gemini-api-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 5. Production Build
```bash
npm run build
npm start
```

---

## 🐍 Running the Lightweight Python Streamlit App (`python_app/`)

### 1. Navigate to the Python directory
```bash
cd python_app
```

### 2. Create and activate a virtual environment
```bash
# macOS / Linux:
python3 -m venv venv
source venv/bin/activate

# Windows:
python -m venv venv
venv\Scripts\activate
```

### 3. Install requirements
```bash
pip install -r requirements.txt
```

### 4. Setup API Keys
```bash
cp .env.example .env
```
Add your `OPENAI_API_KEY` or `GEMINI_API_KEY` to `.env`.

### 5. Start Streamlit
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 📁 Repository Structure

```
├── python_app/              # Complete standalone Python & Streamlit suite
│   ├── app.py               # Streamlit web UI
│   ├── translator_core.py   # Audio extraction, Whisper ASR, Arabic translation & SRT builder
│   ├── requirements.txt     # Minimal Python dependencies
│   ├── .env.example         # Environment template
│   └── README.md            # Python setup instructions
├── src/                     # React frontend source code
│   ├── components/          # Video player, Subtitle editor, Code viewer
│   ├── types.ts             # TypeScript definitions
│   ├── App.tsx              # Main application dashboard
│   └── main.tsx             # Entry point
├── server.ts                # Express backend (Gemini AI API proxy & fallback)
├── package.json             # Node dependencies and scripts
├── vite.config.ts           # Vite configuration
├── .gitignore               # Git ignored patterns
└── README.md                # Project documentation
```

---

## 📄 License
MIT License
