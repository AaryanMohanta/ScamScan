"""
Tests for the main FastAPI endpoints in uploadCall.py.
Run with: pytest backend/tests/ -v
"""
import io
import json
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Patch heavy deps before importing the app
with patch("whisper.load_model", return_value=MagicMock()):
    with patch("google.genai.Client"):
        with patch("web3.Web3"):
            import sys, os
            sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
            from uploadCall import app

client = TestClient(app)


# ---------------------------------------------------------------------------
# Health check
# ---------------------------------------------------------------------------

def test_health_check():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data.get("ok") is True or data.get("status") == "ok"


# ---------------------------------------------------------------------------
# Upload endpoint
# ---------------------------------------------------------------------------

def test_upload_valid_wav():
    wav_bytes = _minimal_wav()
    resp = client.post(
        "/api/calls/upload",
        files={"file": ("test.wav", io.BytesIO(wav_bytes), "audio/wav")},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert "call_id" in body
    assert isinstance(body["call_id"], str)
    assert len(body["call_id"]) > 0


def test_upload_valid_mp3():
    resp = client.post(
        "/api/calls/upload",
        files={"file": ("test.mp3", io.BytesIO(b"\xff\xfb" + b"\x00" * 100), "audio/mpeg")},
    )
    assert resp.status_code == 200
    assert "call_id" in resp.json()


def test_upload_invalid_format():
    resp = client.post(
        "/api/calls/upload",
        files={"file": ("test.txt", io.BytesIO(b"hello"), "text/plain")},
    )
    assert resp.status_code == 400


def test_upload_oversized_file():
    fifty_mb_plus = b"\x00" * (51 * 1024 * 1024)
    resp = client.post(
        "/api/calls/upload",
        files={"file": ("big.wav", io.BytesIO(fifty_mb_plus), "audio/wav")},
    )
    assert resp.status_code == 413


# ---------------------------------------------------------------------------
# Analyse endpoint
# ---------------------------------------------------------------------------

MOCK_TRANSCRIPT = "Please send gift cards to claim your prize."
MOCK_STATS = {"total_reports": 3, "medium_risk_reports": 1, "high_risk_reports": 2}
MOCK_RISK_INT = 2  # High


@patch("uploadCall.submit_caller_report", return_value="0xdeadbeef")
@patch("uploadCall.transcribe")
@patch("uploadCall.get_caller_stats", return_value=MOCK_STATS)
@patch("uploadCall.classify_call", return_value="2")
def test_analyse_high_risk(mock_classify, mock_stats, mock_transcribe, mock_submit):
    mock_transcribe.return_value = MOCK_TRANSCRIPT

    # First upload a file to get a real call_id
    wav = _minimal_wav()
    up = client.post(
        "/api/calls/upload",
        files={"file": ("test.wav", io.BytesIO(wav), "audio/wav")},
    )
    call_id = up.json()["call_id"]

    resp = client.post(
        f"/api/calls/{call_id}/analyse",
        json={"phone_number": "+15551234567"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_level"] == "High"
    assert data["scam_score"] == pytest.approx(0.90)
    assert "transcript" in data
    assert "advice" in data


@patch("uploadCall.submit_caller_report", return_value="0xdeadbeef")
@patch("uploadCall.transcribe")
@patch("uploadCall.get_caller_stats", return_value=MOCK_STATS)
@patch("uploadCall.classify_call", return_value="0")
def test_analyse_low_risk(mock_classify, mock_stats, mock_transcribe, mock_submit):
    mock_transcribe.return_value = "Hello, this is your bank calling about your account."

    wav = _minimal_wav()
    up = client.post(
        "/api/calls/upload",
        files={"file": ("test.wav", io.BytesIO(wav), "audio/wav")},
    )
    call_id = up.json()["call_id"]

    resp = client.post(f"/api/calls/{call_id}/analyse", json={"phone_number": "+15559999999"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["risk_level"] == "Low"
    assert data["scam_score"] == pytest.approx(0.15)


@patch("uploadCall.transcribe")
@patch("uploadCall.get_caller_stats", return_value={"total_reports": 0, "medium_risk_reports": 0, "high_risk_reports": 0})
@patch("uploadCall.classify_call", return_value="1")
def test_analyse_no_phone_number(mock_classify, mock_stats, mock_transcribe):
    """Omitting phone_number should still work — stats default to zero."""
    mock_transcribe.return_value = "You may have won a prize."

    wav = _minimal_wav()
    up = client.post(
        "/api/calls/upload",
        files={"file": ("test.wav", io.BytesIO(wav), "audio/wav")},
    )
    call_id = up.json()["call_id"]

    resp = client.post(f"/api/calls/{call_id}/analyse")
    assert resp.status_code == 200
    assert resp.json()["risk_level"] == "Medium"


@patch("uploadCall.transcribe", side_effect=FileNotFoundError("No audio found"))
def test_analyse_missing_audio(mock_transcribe):
    resp = client.post("/api/calls/nonexistent-id/analyse")
    assert resp.status_code == 404


# ---------------------------------------------------------------------------
# WebSocket endpoint — basic connection test
# ---------------------------------------------------------------------------

@patch("live_call_ws.transcribe_file", return_value="Your account has been compromised.")
@patch("live_call_ws.classify_call", return_value="2")
@patch("live_call_ws.get_caller_stats", return_value={"total_reports": 0, "medium_risk_reports": 0, "high_risk_reports": 0})
def test_websocket_live_call(mock_stats, mock_classify, mock_transcribe):
    with client.websocket_connect("/ws/live-call?phone_number=%2B15551234567") as ws:
        ws.send_bytes(_minimal_wav())
        data = ws.receive_json()
    assert "chunk" in data
    assert data["chunk"] == 1
    assert "risk_level" in data
    assert data["risk_level"] in ("Low", "Medium", "High")
    assert "scam_score" in data
    assert 0.0 <= data["scam_score"] <= 1.0


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _minimal_wav() -> bytes:
    """Return a valid 44-byte WAV header with no audio data."""
    import struct
    num_samples = 0
    sample_rate = 16000
    num_channels = 1
    bits_per_sample = 16
    byte_rate = sample_rate * num_channels * bits_per_sample // 8
    block_align = num_channels * bits_per_sample // 8
    data_size = num_samples * block_align

    header = struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF",
        36 + data_size,
        b"WAVE",
        b"fmt ",
        16,
        1,               # PCM
        num_channels,
        sample_rate,
        byte_rate,
        block_align,
        bits_per_sample,
        b"data",
        data_size,
    )
    return header
