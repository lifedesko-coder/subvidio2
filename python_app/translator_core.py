"""
Core processing utilities for Hindi to Arabic video translation and SRT generation.
Designed to be lightweight, modular, and easy to maintain without heavy external installations.
"""

import os
import json
import tempfile
from typing import List, Dict, Any, Optional

def seconds_to_srt_time(seconds: float) -> str:
    """
    Converts a floating-point number of seconds to SRT timestamp format: HH:MM:SS,mmm
    Example: 65.25 -> 00:01:05,250
    """
    total_ms = int(round(seconds * 1000))
    ms = total_ms % 1000
    total_seconds = total_ms // 1000
    secs = total_seconds % 60
    total_minutes = total_seconds // 60
    mins = total_minutes % 60
    hours = total_minutes // 60
    return f"{hours:02d}:{mins:02d}:{secs:02d},{ms:03d}"

def extract_audio(video_file_bytes: bytes, original_filename: str = "input_video.mp4") -> str:
    """
    Extracts audio track from an uploaded video file using moviepy.
    MoviePy automatically leverages the lightweight imageio-ffmpeg python wheel,
    so no manual system-level FFmpeg installation is required!
    
    Returns the file path to the temporary .mp3 audio file.
    """
    # Create temporary file for input video
    suffix = os.path.splitext(original_filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp_video:
        temp_video.write(video_file_bytes)
        temp_video_path = temp_video.name

    temp_audio_path = tempfile.mktemp(suffix=".mp3")

    try:
        # Import moviepy dynamically to keep memory footprint minimal
        from moviepy.editor import VideoFileClip
        
        with VideoFileClip(temp_video_path) as video:
            if video.audio is None:
                raise ValueError("The provided video file has no audio track.")
            # Extract audio with standard 128k bitrate for lightweight processing
            video.audio.write_audiofile(
                temp_audio_path,
                codec="libmp3lame",
                bitrate="128k",
                logger=None  # Suppress verbose terminal output
            )
        return temp_audio_path
    finally:
        # Clean up temporary video file immediately
        if os.path.exists(temp_video_path):
            try:
                os.remove(temp_video_path)
            except Exception:
                pass

def transcribe_hindi_whisper(audio_path: str, api_key: str) -> List[Dict[str, Any]]:
    """
    Transcribes Hindi audio using OpenAI Whisper API with segment timestamps.
    """
    from openai import OpenAI
    client = OpenAI(api_key=api_key)

    with open(audio_path, "rb") as audio_file:
        transcript = client.audio.transcriptions.create(
            file=audio_file,
            model="whisper-1",
            language="hi",
            response_format="verbose_json",
            timestamp_granularities=["segment"]
        )

    segments = []
    # Whisper verbose_json provides segments with start, end, text
    raw_segments = getattr(transcript, "segments", []) or []
    for idx, seg in enumerate(raw_segments):
        start = seg.get("start", 0.0) if isinstance(seg, dict) else getattr(seg, "start", 0.0)
        end = seg.get("end", 0.0) if isinstance(seg, dict) else getattr(seg, "end", 0.0)
        text = seg.get("text", "") if isinstance(seg, dict) else getattr(seg, "text", "")
        
        text = text.strip()
        if text:
            segments.append({
                "id": idx + 1,
                "start": float(start),
                "end": float(end),
                "hindi_text": text,
            })
    return segments

def translate_segments_to_arabic(
    segments: List[Dict[str, Any]], 
    api_key: str, 
    provider: str = "openai",
    arabic_dialect: str = "Modern Standard Arabic (الفصحى)"
) -> List[Dict[str, Any]]:
    """
    Translates Hindi segments into context-aware Arabic subtitles.
    Uses structured prompt and batching to guarantee natural phrasing and subtitle brevity.
    """
    if not segments:
        return []

    # Prepare compact prompt representation
    items_to_translate = [
        {"id": seg["id"], "hindi": seg["hindi_text"]}
        for seg in segments
    ]

    system_instruction = (
        f"You are a master literary translator specializing in Hindi to Arabic subtitling. "
        f"Translate the provided Hindi subtitle lines into natural, context-aware {arabic_dialect}. "
        f"Subtitling rules: "
        f"1. Produce clear, natural, and idiomatic Arabic subtitles. "
        f"2. Keep subtitles concise so they can be easily read on screen. "
        f"3. Strictly maintain the exact same item 'id' for each line. "
        f"4. Return ONLY valid JSON array of objects with keys: 'id' (integer) and 'arabic' (string). No markdown backticks."
    )

    prompt = (
        f"Translate these Hindi subtitle lines into {arabic_dialect}:\n"
        f"{json.dumps(items_to_translate, ensure_ascii=False, indent=2)}"
    )

    if provider == "openai":
        from openai import OpenAI
        client = OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": system_instruction},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content or "{}"
        parsed = json.loads(content)
        # Handle cases where LLM wraps list in a root key like {"translations": [...]}
        if isinstance(parsed, dict):
            arabic_items = next((v for v in parsed.values() if isinstance(v, list)), [])
        elif isinstance(parsed, list):
            arabic_items = parsed
        else:
            arabic_items = []
            
    elif provider == "gemini":
        from google import genai
        client = genai.Client(api_key=api_key)
        # Use available modern models with automatic fallback
        response = None
        for m in ["gemini-3.1-flash-lite", "gemini-2.5-flash"]:
            try:
                response = client.models.generate_content(
                    model=m,
                    contents=f"{system_instruction}\n\n{prompt}",
                    config={"response_mime_type": "application/json"}
                )
                if response and response.text:
                    break
            except Exception:
                continue
        if not response or not response.text:
            raise RuntimeError("Gemini model translation unavailable. Please retry shortly.")
        parsed = json.loads(response.text or "[]")
        if isinstance(parsed, dict):
            arabic_items = next((v for v in parsed.values() if isinstance(v, list)), [])
        else:
            arabic_items = parsed
    else:
        raise ValueError(f"Unsupported translation provider: {provider}")

    # Map translations back to segments
    trans_map = {item.get("id"): item.get("arabic", "").strip() for item in arabic_items if isinstance(item, dict)}

    result_segments = []
    for seg in segments:
        seg_copy = dict(seg)
        arabic_text = trans_map.get(seg["id"], "")
        seg_copy["arabic_text"] = arabic_text if arabic_text else seg["hindi_text"]
        result_segments.append(seg_copy)

    return result_segments

def generate_srt(segments: List[Dict[str, Any]], language_key: str = "arabic_text") -> str:
    """
    Generates standard SRT file string from segments.
    Each block follows:
    [Index]
    [HH:MM:SS,mmm] --> [HH:MM:SS,mmm]
    [Subtitle text]
    (blank line)
    """
    lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = seconds_to_srt_time(seg["start"])
        end_time = seconds_to_srt_time(seg["end"])
        text = seg.get(language_key, seg.get("arabic_text", "")).strip()
        
        lines.append(f"{idx}")
        lines.append(f"{start_time} --> {end_time}")
        lines.append(text)
        lines.append("")  # Empty line separator

    return "\n".join(lines)

def generate_bilingual_srt(segments: List[Dict[str, Any]]) -> str:
    """
    Generates bilingual SRT with Arabic on top and Hindi on bottom.
    """
    lines = []
    for idx, seg in enumerate(segments, start=1):
        start_time = seconds_to_srt_time(seg["start"])
        end_time = seconds_to_srt_time(seg["end"])
        arabic = seg.get("arabic_text", "").strip()
        hindi = seg.get("hindi_text", "").strip()
        
        lines.append(f"{idx}")
        lines.append(f"{start_time} --> {end_time}")
        lines.append(f"{arabic}\n({hindi})")
        lines.append("")

    return "\n".join(lines)
