# ScamAnalysisEngine.py
"""
Robust Gemini-backed scam-call classifier.
- Prints exactly one character: 0 (low), 1 (medium), or 2 (high).
- Lists available models if you want to inspect them.
- Retries an ordered list of candidate models if a model is unavailable.
Requirements:
  pip install google-genai
  Set your API key (GEMINI_API_KEY or GOOGLE_API_KEY as appropriate) or configure Vertex credentials.
"""

import re
import os
from typing import Optional, List

from google import genai
from google.genai import errors as genai_errors

GEMINI_API_KEY = "AIzaSyAwl4mpuCoAtU6JR0_U5C890728GmgVLN4"

# Create client (will auto-pick up credentials from environment typically)
client = genai.Client(api_key=GEMINI_API_KEY)

# Candidate models to try (ordered). Update or reorder if you have other preferred models.
CANDIDATE_MODELS = [
    "gemini-1.5-pro",
    "gemini-1.5-flash",
    "gemini-1.0",        # include conservative names — your account may have different labels
    "chat-bison"         # Vertex-style fallback (if you're on Vertex), may or may not be present
]

def list_available_models() -> List[str]:
    """Return a list of model names available to your client (for debugging)."""
    try:
        models = client.models.list()
        # models might be a list-like of objects with .name
        return [getattr(m, "name", str(m)) for m in models]
    except Exception as e:
        # Don't crash; return empty list on error
        return []

def _build_prompt(transcript: str, total_logs: int, medium_flags: int, high_flags: int) -> str:
    return (
        "You are a classification assistant that MUST respond with exactly one character: 0, 1, or 2, and nothing else.\n\n"
        f"Input:\n- Transcript: \"\"\"{transcript}\"\"\"\n"
        f"- Total times this phone number has been logged: {total_logs}\n"
        f"- Times flagged as MEDIUM-likelihood calls: {medium_flags}\n"
        f"- Times flagged as HIGH-likelihood calls: {high_flags}\n\n"
        "Scoring rules:\n0 = low likelihood of scam\n1 = medium likelihood of scam\n2 = high likelihood of scam\n\n"
        "Consider transcript indicators (urgent requests, money requests, verification codes, threats, "
        "requests for remote access, gift cards, etc.) and numeric history.  "
        "CRUCIALLY: reply with EXACTLY one character (0 or 1 or 2) and nothing else."
    )

def _call_with_model(prompt: str, model: str) -> str:
    """
    Call the given model. Return raw response text.
    Raise the underlying exception to let the caller decide how to handle it.
    """
    # Different SDKs may return objects with different attributes.
    response = client.models.generate_content(model=model, contents=prompt)
    # Try common ways to read text
    text = getattr(response, "text", None)
    if text:
        return text
    # Fallback to nested structure used by some SDK versions:
    try:
        return response.output[0].content[0].text
    except Exception:
        return str(response)

def _extract_exact_label(text: str) -> Optional[str]:
    """
    Return the exact single-character label if the model output is EXACTLY one of 0/1/2.
    Do not accept extra whitespace or commentary.
    """
    if text is None:
        return None
    # Trim surrounding whitespace and newlines
    s = text.strip()
    # If it's exactly one character and in the set, accept it
    if len(s) == 1 and s in {"0", "1", "2"}:
        return s
    # Otherwise reject
    return None

def _fallback_rule(transcript: str, total_logs: int, medium_flags: int, high_flags: int) -> str:
    """Deterministic fallback if LLM is unavailable or returns bad output."""
    t = transcript.lower()
    scam_keywords = [
        "send money", "wire", "western union", "gift card", "social security",
        "ssn", "account suspended", "verify your account", "press 1", "press 2",
        "immediately", "unauthorized", "confirm your", "verification code",
        "pay now", "bank transfer", "atm", "lottery", "congratulations you won",
        "one-time code", "otp", "call back"
    ]
    keyword_hits = sum(1 for k in scam_keywords if k in t)
    high_ratio = high_flags / max(1, total_logs)
    med_ratio = medium_flags / max(1, total_logs)

    # Heuristics — tune for your dataset
    if high_flags > 0 or high_ratio >= 0.2 or keyword_hits >= 2:
        return "2"
    if medium_flags > 0 or med_ratio >= 0.2 or keyword_hits == 1:
        return "1"
    return "0"

def classify_call(
    transcript: str,
    total_logs: int,
    medium_flags: int,
    high_flags: int,
    candidate_models: List[str] = None,
    list_models_if_none_available: bool = False
) -> str:
    """
    Return exactly one character string: '0', '1', or '2'.
    Attempts an ordered list of models. Falls back deterministically if needed.
    """
    prompt = _build_prompt(transcript, total_logs, medium_flags, high_flags)
    models_to_try = candidate_models or CANDIDATE_MODELS

    last_error = None
    # Try each candidate model until one works and returns an exact label
    for model_name in models_to_try:
        try:
            raw = _call_with_model(prompt, model=model_name)
            label = _extract_exact_label(raw)
            if label:
                return label
            # If model returned something but not exactly one char, try next model
            last_error = RuntimeError(f"Model {model_name} returned invalid output: {repr(raw)}")
        except genai_errors.ClientError as ce:
            # If model is not found, try next candidate. Save last_error for logging/final decision.
            last_error = ce
            # If it is a 404 for model not found, continue; otherwise if it's a transient error we might retry next model.
            continue
        except Exception as e:
            last_error = e
            continue

    # If we get here, all model attempts failed or returned invalid outputs.
    # Optionally return a list of available models somewhere for troubleshooting.
    if list_models_if_none_available:
        available = list_available_models()
        # we don't print this to stdout because the user requested exactly one character output.
        # but we could optionally log to stderr or a file — for now we ignore printing.
        # (If you want to debug, run list_available_models() in an interactive session)
    # Use deterministic fallback to guarantee a valid output
    return _fallback_rule(transcript, total_logs, medium_flags, high_flags)

# ----------------------
# Example run (main)
# ----------------------
if __name__ == "__main__":
    # Replace with inputs from your system
    """
    example_transcript = (
        "Hello, this is security. We detected unusual activity on your account. "
        "Please verify your account number and send the one-time code to reactivate. "
        "If you don't pay a small fee your account will be closed."
    )
    total_logs = 25
    medium_flags = 3
    high_flags = 1
    """

    example_transcript = (
        "Hey, its Adam. You want to come to play cricket tomorrow?"
        "I'm bringing my cricket bat and ball, make sure to bring your stumps."
        "Oh yeah I'm also bringing some sandwiches so we can have a picnic"
    )
    total_logs = 150
    medium_flags = 0
    high_flags = 0


    # If you want to inspect available models for debugging, uncomment:
    #print("Available models:", list_available_models())

    label = classify_call(
        example_transcript,
        total_logs,
        medium_flags,
        high_flags,
        candidate_models=CANDIDATE_MODELS,
        list_models_if_none_available=False
    )

    # Print exactly the single digit with no trailing newline/padding
    print(label, end="")
