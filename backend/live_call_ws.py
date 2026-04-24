# backend/live_call_ws.py
"""
WebSocket endpoint for live call scam detection.

Flow:
  Android sends binary WAV chunks every ~10 seconds
  → backend transcribes each chunk with Whisper
  → accumulates transcript
  → classifies with Gemini
  → sends back JSON result after each chunk
"""

import os
import tempfile
from fastapi import WebSocket, WebSocketDisconnect

from TranscriptionEngine import transcribe_file
from ScamAnalysisEngine import classify_call
from blockchain.scam_registry import get_caller_stats

_RISK_LABEL = {0: "Low", 1: "Medium", 2: "High"}
_RISK_SCORE  = {0: 0.15, 1: 0.55, 2: 0.90}
_RISK_ADVICE = {
    0: "No threats detected. This call appears consistent with normal behaviour.",
    1: "Proceed with caution. Some language resembles common spam or social-engineering attempts.",
    2: "Do not engage. This call matches patterns from known scam scripts.",
}


async def live_call_ws(websocket: WebSocket, phone_number: str = ""):
    """
    Accept a WebSocket connection from the Android app.
    Expects binary messages containing raw WAV audio chunks.
    Replies with JSON after each chunk:
        {
          "chunk": <int>,
          "transcript": "<accumulated text>",
          "risk_level": "Low" | "Medium" | "High",
          "scam_score": <float 0–1>,
          "advice": "<string>"
        }
    """
    await websocket.accept()

    accumulated_transcript = ""
    chunk_index = 0

    # Pull blockchain history once at connection start (if phone number supplied)
    if phone_number:
        try:
            stats = get_caller_stats(phone_number)
        except Exception:
            stats = {"total_reports": 0, "high_risk_reports": 0, "medium_risk_reports": 0}
    else:
        stats = {"total_reports": 0, "high_risk_reports": 0, "medium_risk_reports": 0}

    try:
        while True:
            audio_bytes = await websocket.receive_bytes()
            chunk_index += 1

            # Write chunk to a temp WAV file so Whisper can read it
            tmp_fd, tmp_path = tempfile.mkstemp(suffix=".wav")
            try:
                with os.fdopen(tmp_fd, "wb") as f:
                    f.write(audio_bytes)

                chunk_text = transcribe_file(tmp_path)
            finally:
                try:
                    os.unlink(tmp_path)
                except OSError:
                    pass

            if chunk_text:
                accumulated_transcript = (accumulated_transcript + " " + chunk_text).strip()

            # Classify the accumulated transcript so far
            risk_int = int(classify_call(
                accumulated_transcript or "(silence)",
                stats["total_reports"],
                stats["medium_risk_reports"],
                stats["high_risk_reports"],
            ))

            await websocket.send_json({
                "chunk":       chunk_index,
                "transcript":  accumulated_transcript,
                "risk_level":  _RISK_LABEL[risk_int],
                "scam_score":  _RISK_SCORE[risk_int],
                "advice":      _RISK_ADVICE[risk_int],
            })

    except WebSocketDisconnect:
        pass
    except Exception as e:
        # Best-effort: try to notify client before closing
        try:
            await websocket.send_json({"error": str(e)})
        except Exception:
            pass
