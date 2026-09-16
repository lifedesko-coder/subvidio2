"""
Streamlit Application: Lightweight Hindi to Arabic Video Translator & SRT Subtitle Generator
"""

import os
import streamlit as st
from dotenv import load_dotenv
from translator_core import (
    extract_audio,
    transcribe_hindi_whisper,
    translate_segments_to_arabic,
    generate_srt,
    generate_bilingual_srt,
    seconds_to_srt_time,
)

# Load environment variables if present
load_dotenv()

# Page configuration
st.set_page_config(
    page_title="Hindi to Arabic Video Translator",
    page_icon="🎬",
    layout="wide",
    initial_sidebar_state="expanded",
)

# Custom CSS for clean, minimalist Arabic typography and styling
st.markdown("""
<style>
    .main-title {
        font-size: 2.2rem;
        font-weight: 700;
        margin-bottom: 0.2rem;
    }
    .subtitle {
        color: #64748b;
        font-size: 1.05rem;
        margin-bottom: 1.5rem;
    }
    .arabic-text {
        direction: rtl;
        text-align: right;
        font-family: 'Amiri', 'Segoe UI', Tahoma, sans-serif;
        font-size: 1.25rem;
        line-height: 1.8;
    }
    .badge {
        display: inline-block;
        padding: 0.25rem 0.6rem;
        border-radius: 9999px;
        font-size: 0.75rem;
        font-weight: 600;
        background-color: #f1f5f9;
        color: #475569;
    }
</style>
""", unsafe_allow_html=True)

# Application Header
st.markdown('<div class="main-title">🎬 Hindi to Arabic Video Subtitle Translator</div>', unsafe_allow_html=True)
st.markdown('<div class="subtitle">Extract audio, transcribe Hindi speech with accurate timestamps, translate to natural Arabic, and download standard .SRT subtitles.</div>', unsafe_allow_html=True)

# Sidebar Configuration
with st.sidebar:
    st.header("⚙️ Configuration")
    
    # API Provider Selection
    provider = st.selectbox(
        "ASR & Translation Engine",
        options=["OpenAI (Whisper + GPT-4o-mini)", "Gemini (Gemini 2.5 Flash)"],
        index=0
    )
    
    # API Key Handling (Reads from .env or manual input)
    default_key = ""
    if "OpenAI" in provider:
        default_key = os.getenv("OPENAI_API_KEY", "")
        api_key = st.text_input("OpenAI API Key", value=default_key, type="password", help="Enter your OpenAI API key for Whisper and GPT-4o-mini.")
    else:
        default_key = os.getenv("GEMINI_API_KEY", "")
        api_key = st.text_input("Gemini API Key", value=default_key, type="password", help="Enter your Google Gemini API key.")

    st.markdown("---")
    
    # Arabic Dialect / Tone
    dialect = st.selectbox(
        "Arabic Subtitle Style",
        options=[
            "Modern Standard Arabic (الفصحى)",
            "Egyptian Arabic (اللهجة المصرية)",
            "Gulf Arabic (اللهجة الخليجية)",
            "Levantine Arabic (اللهجة الشامية)"
        ],
        index=0
    )
    
    st.info("💡 **Lightweight Architecture:** Uses `moviepy` with bundled `imageio-ffmpeg`. No standalone system FFmpeg installation required.")

# Main Interface: File Upload
col_left, col_right = st.columns([1, 1], gap="large")

with col_left:
    st.subheader("1. Upload Video File")
    uploaded_file = st.file_uploader(
        "Choose a video with Hindi audio (MP4, MKV, MOV, WebM)",
        type=["mp4", "mkv", "mov", "webm", "avi"]
    )

    if uploaded_file is not None:
        file_details = {"Filename": uploaded_file.name, "File size": f"{uploaded_file.size / (1024*1024):.2f} MB"}
        st.write(file_details)
        st.video(uploaded_file)

with col_right:
    st.subheader("2. Process & Translate")
    
    if uploaded_file is None:
        st.info("👈 Upload a video file on the left to start generating Arabic subtitles.")
    else:
        if not api_key:
            st.warning("⚠️ Please provide an API key in the sidebar configuration to proceed.")
        
        start_btn = st.button("🚀 Start Hindi to Arabic Translation", type="primary", use_container_width=True)
        
        if start_btn:
            progress_bar = st.progress(0)
            status_placeholder = st.empty()
            
            try:
                # Step 1: Lightweight Audio Extraction
                status_placeholder.info("⏳ Step 1/4: Extracting audio track using lightweight Python moviepy...")
                progress_bar.progress(20)
                video_bytes = uploaded_file.read()
                audio_path = extract_audio(video_bytes, uploaded_file.name)
                
                # Step 2: Speech-to-Text Transcription
                status_placeholder.info("🎙️ Step 2/4: Transcribing Hindi speech and generating timestamps (ASR)...")
                progress_bar.progress(50)
                
                if "OpenAI" in provider:
                    segments = transcribe_hindi_whisper(audio_path, api_key=api_key)
                else:
                    # Gemini multimodal transcription & translation fallback
                    from translator_core import transcribe_hindi_whisper
                    # If using OpenAI Whisper for timestamps:
                    segments = transcribe_hindi_whisper(audio_path, api_key=api_key)
                
                # Cleanup extracted audio
                if os.path.exists(audio_path):
                    try:
                        os.remove(audio_path)
                    except Exception:
                        pass
                
                if not segments:
                    st.error("No speech segments could be detected in the video audio.")
                    st.stop()
                    
                # Step 3: AI Translation
                status_placeholder.info(f"🌐 Step 3/4: Translating Hindi text into natural {dialect}...")
                progress_bar.progress(75)
                
                trans_provider = "openai" if "OpenAI" in provider else "gemini"
                translated_segments = translate_segments_to_arabic(
                    segments,
                    api_key=api_key,
                    provider=trans_provider,
                    arabic_dialect=dialect
                )
                
                # Step 4: SRT Subtitle Generation
                status_placeholder.info("📝 Step 4/4: Formatting SRT subtitle timestamps...")
                progress_bar.progress(95)
                
                arabic_srt = generate_srt(translated_segments, language_key="arabic_text")
                bilingual_srt = generate_bilingual_srt(translated_segments)
                
                progress_bar.progress(100)
                status_placeholder.success("✅ Translation completed successfully!")
                
                # Store in session state for downloading and preview
                st.session_state["segments"] = translated_segments
                st.session_state["arabic_srt"] = arabic_srt
                st.session_state["bilingual_srt"] = bilingual_srt
                st.session_state["original_name"] = uploaded_file.name
                
            except Exception as e:
                status_placeholder.error(f"❌ Processing Error: {str(e)}")

# Results and Downloads Display
if "segments" in st.session_state and st.session_state["segments"]:
    st.markdown("---")
    st.subheader("3. Subtitle Results & Download")
    
    base_name = os.path.splitext(st.session_state.get("original_name", "video"))[0]
    
    col_d1, col_d2, col_d3 = st.columns(3)
    with col_d1:
        st.download_button(
            label="📥 Download Arabic .SRT",
            data=st.session_state["arabic_srt"],
            file_name=f"{base_name}_arabic.srt",
            mime="text/plain",
            use_container_width=True,
            type="primary"
        )
    with col_d2:
        st.download_button(
            label="📥 Download Bilingual .SRT (Arabic + Hindi)",
            data=st.session_state["bilingual_srt"],
            file_name=f"{base_name}_bilingual.srt",
            mime="text/plain",
            use_container_width=True
        )
    with col_d3:
        # Full text script
        arabic_script = "\n".join([f"{seg['arabic_text']}" for seg in st.session_state["segments"]])
        st.download_button(
            label="📄 Download Arabic Text Only (.txt)",
            data=arabic_script,
            file_name=f"{base_name}_arabic_script.txt",
            mime="text/plain",
            use_container_width=True
        )

    # Subtitle Segments Table Preview
    st.markdown("### 📋 Subtitle Segments Preview")
    
    preview_data = []
    for seg in st.session_state["segments"]:
        start_str = seconds_to_srt_time(seg["start"])
        end_str = seconds_to_srt_time(seg["end"])
        preview_data.append({
            "#": seg["id"],
            "Time Interval": f"{start_str} ➔ {end_str}",
            "Hindi Original (हिंदी)": seg["hindi_text"],
            "Arabic Translation (العربية)": seg["arabic_text"]
        })
    
    st.dataframe(
        preview_data,
        use_container_width=True,
        hide_index=True
    )

    # Raw SRT code view
    with st.expander("🔍 View Raw .SRT Subtitle Output"):
        st.code(st.session_state["arabic_srt"], language="plaintext")
