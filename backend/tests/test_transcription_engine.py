"""
Tests for TranscriptionEngine.py
"""
import os
import struct
import tempfile
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock


# ---------------------------------------------------------------------------
# Mock whisper before importing the module
# ---------------------------------------------------------------------------

mock_model = MagicMock()
mock_model.transcribe.return_value = {"text": "  Hello, this is a test transcription.  "}

with patch("whisper.load_model", return_value=mock_model):
    import sys
    sys.path.insert(0, str(Path(__file__).parent.parent))
    from TranscriptionEngine import transcribe, transcribe_file


# ---------------------------------------------------------------------------
# transcribe_file()
# ---------------------------------------------------------------------------

def test_transcribe_file_returns_stripped_text(tmp_path):
    wav = tmp_path / "sample.wav"
    wav.write_bytes(_minimal_wav())

    result = transcribe_file(str(wav))
    assert result == "Hello, this is a test transcription."


def test_transcribe_file_strips_whitespace(tmp_path):
    mock_model.transcribe.return_value = {"text": "\n  Extra whitespace.\n  "}
    wav = tmp_path / "sample.wav"
    wav.write_bytes(_minimal_wav())

    result = transcribe_file(str(wav))
    assert result == "Extra whitespace."


# ---------------------------------------------------------------------------
# transcribe()  — by call_id
# ---------------------------------------------------------------------------

def test_transcribe_finds_wav(tmp_path):
    """transcribe() should find a .wav file by call_id."""
    mock_model.transcribe.return_value = {"text": "found wav"}

    with patch("TranscriptionEngine.TMP_DIR", tmp_path):
        wav = tmp_path / "abc123.wav"
        wav.write_bytes(_minimal_wav())
        result = transcribe("abc123")

    assert result == "found wav"


def test_transcribe_finds_m4a(tmp_path):
    """transcribe() should find a .m4a file when .wav is absent."""
    mock_model.transcribe.return_value = {"text": "found m4a"}

    with patch("TranscriptionEngine.TMP_DIR", tmp_path):
        m4a = tmp_path / "xyz999.m4a"
        m4a.write_bytes(b"\x00" * 64)
        result = transcribe("xyz999")

    assert result == "found m4a"


def test_transcribe_raises_when_missing(tmp_path):
    with patch("TranscriptionEngine.TMP_DIR", tmp_path):
        with pytest.raises(FileNotFoundError, match="No audio file found"):
            transcribe("does-not-exist")


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _minimal_wav() -> bytes:
    return struct.pack(
        "<4sI4s4sIHHIIHH4sI",
        b"RIFF", 36, b"WAVE", b"fmt ",
        16, 1, 1, 16000, 32000, 2, 16,
        b"data", 0,
    )
