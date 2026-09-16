# Hindi to Arabic Video Translator (Streamlit + Lightweight Python)

A lightweight and simple Python application to translate video files from **Hindi to Arabic** with high accuracy, while generating a properly timed **SRT subtitle file**.

---

## 🌟 Key Highlights & Architectural Features

1. **Lightweight Audio Extraction**:
   - Uses `moviepy` which ships with `imageio-ffmpeg` pre-compiled wheels.
   - **No complex manual installation of standalone system-level FFmpeg required!**
2. **High-Accuracy Speech-to-Text (ASR)**:
   - Uses OpenAI Whisper API (`whisper-1`) with segment-level timestamp granularities to capture precise millisecond timing of spoken Hindi sentences.
   - Supports Gemini multimodal audio processing as an alternative engine.
3. **Context-Aware AI Translation**:
   - Uses `gpt-4o-mini` or `gemini-2.5-flash` with fine-tuned subtitling prompts to translate colloquial or formal Hindi into natural, idiomatic Arabic (supports Modern Standard Arabic, Egyptian, Gulf, and Levantine styles).
4. **Standard SRT Generation**:
   - Automatically formats timing into compliant `00:00:00,000 --> 00:00:00,000` subtitle tracks.
   - Supports exporting **Arabic SRT**, **Bilingual SRT** (Arabic + Hindi), and clean text transcripts.
5. **Minimalist Streamlit UI**:
   - File drag-and-drop, interactive video player, multi-stage progress bar, side-by-side segment viewer, and instant 1-click download.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.9+ installed on your computer (tested on Python 3.9, 3.10, 3.11, 3.12).
- An OpenAI API Key (or Google Gemini API Key).

### 2. Setup Virtual Environment
Open your terminal in the `python_app` folder:

```bash
# Clone or navigate to the project directory
cd python_app

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# On macOS / Linux:
source venv/bin/activate

# On Windows:
venv\Scripts\activate
```

### 3. Install Minimal Dependencies
Install the required lightweight packages:

```bash
pip install -r requirements.txt
```

*(Note: dependencies are kept minimal: `streamlit`, `moviepy`, `openai`, `google-genai`, and `python-dotenv`).*

### 4. Configure Your API Key
Copy the `.env.example` file to `.env`:

```bash
cp .env.example .env
```

Open `.env` in any text editor and paste your OpenAI API key:
```env
OPENAI_API_KEY=sk-your-openai-api-key-here
```
*(You can also input your API key directly in the Streamlit web sidebar at runtime).*

### 5. Run the Application
Launch the Streamlit interface:

```bash
streamlit run app.py
```

Streamlit will automatically open your default browser at:
👉 **`http://localhost:8501`**

---

## 📁 Project Structure

```
python_app/
├── app.py                 # Clean Streamlit user interface with progress bars & downloads
├── translator_core.py     # Pure Python audio extractor, Whisper ASR, LLM translator & SRT builder
├── requirements.txt       # Minimal Python package dependencies
├── .env.example           # Template for API keys
└── README.md              # Setup guide and documentation
```

---

## 🛠️ Standalone CLI Usage (Optional)

You can also run the translator as a standalone Python script without the Streamlit UI:

```bash
python -c '
from translator_core import extract_audio, transcribe_hindi_whisper, translate_segments_to_arabic, generate_srt
import os

api_key = os.getenv("OPENAI_API_KEY")
with open("sample_hindi.mp4", "rb") as f:
    audio_path = extract_audio(f.read())
segments = transcribe_hindi_whisper(audio_path, api_key)
translated = translate_segments_to_arabic(segments, api_key)
srt_output = generate_srt(translated)
with open("output_arabic.srt", "w", encoding="utf-8") as out:
    out.write(srt_output)
print("Arabic SRT subtitle generated successfully!")
'
```
