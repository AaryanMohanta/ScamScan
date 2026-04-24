import whisper
from pathlib import Path

MODEL = whisper.load_model("base")

BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp"

def transcribe_file(file_path: str) -> str:
    """Transcribe an audio file given its absolute path."""
    result = MODEL.transcribe(file_path)
    return result["text"].strip()


def transcribe(call_id: str) -> str:
    """
    Takes a call_id, finds the matching audio file in tmp/,
    transcribes it with Whisper, and returns the text.
    """
    for ext in (".m4a", ".mp3", ".wav", ".ogg"):
        candidate = TMP_DIR / f"{call_id}{ext}"
        if candidate.exists():
            result = MODEL.transcribe(str(candidate))
            return result["text"].strip()

    raise FileNotFoundError(f"No audio file found for call_id: {call_id}")


if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python TranscriptionEngine.py <call_id>")
        sys.exit(1)
    print(transcribe(sys.argv[1]))
