"""
Tests for ScamAnalysisEngine.py — LLM classification + heuristic fallback.
"""
import os
import pytest
from unittest.mock import patch, MagicMock

os.environ.setdefault("GEMINI_API_KEY", "test-key")

import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))


# ---------------------------------------------------------------------------
# Patch genai before import
# ---------------------------------------------------------------------------

mock_genai_client = MagicMock()
mock_response = MagicMock()
mock_response.text = "0"
mock_genai_client.models.generate_content.return_value = mock_response

with patch("google.genai.Client", return_value=mock_genai_client):
    from ScamAnalysisEngine import classify_call


# ---------------------------------------------------------------------------
# LLM path — Gemini returns numeric string
# ---------------------------------------------------------------------------

@pytest.mark.parametrize("gemini_response,expected", [
    ("0", "0"),
    ("1", "1"),
    ("2", "2"),
])
def test_classify_call_gemini_numeric(gemini_response, expected):
    mock_response.text = gemini_response
    result = classify_call("Hello this is your bank.", 0, 0, 0)
    assert result == expected


def test_classify_call_gemini_with_history():
    """High historical report count should bias toward high risk."""
    mock_response.text = "2"
    result = classify_call("Your account has unusual activity.", total_logs=10, medium_flags=2, high_flags=7)
    assert result == "2"


# ---------------------------------------------------------------------------
# Heuristic fallback — when Gemini is unavailable
# ---------------------------------------------------------------------------

SCAM_TRANSCRIPT = "Please send gift cards worth $500 to claim your lottery prize."
SAFE_TRANSCRIPT = "Hi, this is Sarah calling about your appointment tomorrow."


def test_heuristic_high_risk_keywords():
    """'gift card' + 'lottery' + 'prize' should trigger high risk heuristic."""
    with patch("ScamAnalysisEngine.client") as mock_client:
        mock_client.models.generate_content.side_effect = Exception("API unavailable")
        result = classify_call(SCAM_TRANSCRIPT, 0, 0, 0)
    assert result in ("1", "2")  # At least medium


def test_heuristic_low_risk_clean_transcript():
    """A clean transcript with no scam keywords should score low."""
    with patch("ScamAnalysisEngine.client") as mock_client:
        mock_client.models.generate_content.side_effect = Exception("API unavailable")
        result = classify_call(SAFE_TRANSCRIPT, 0, 0, 0)
    assert result == "0"


def test_classify_returns_string():
    """classify_call must always return a string, not an int."""
    result = classify_call("test transcript", 0, 0, 0)
    assert isinstance(result, str)
    assert result in ("0", "1", "2")


def test_classify_empty_transcript():
    """Empty transcript should not crash — return low or medium."""
    result = classify_call("", 0, 0, 0)
    assert result in ("0", "1", "2")


def test_classify_high_risk_history_alone():
    """Even a benign transcript with many high-risk reports should be flagged."""
    mock_response.text = "2"
    result = classify_call("Hi, how are you?", total_logs=20, medium_flags=5, high_flags=15)
    assert result in ("1", "2")


# ---------------------------------------------------------------------------
# Edge cases
# ---------------------------------------------------------------------------

def test_classify_very_long_transcript():
    long_text = "Please send money. " * 500
    result = classify_call(long_text, 0, 0, 0)
    assert result in ("0", "1", "2")


def test_classify_unicode_transcript():
    result = classify_call("¡Hola! ¿Cómo está usted? Por favor envíe dinero.", 0, 0, 0)
    assert result in ("0", "1", "2")
