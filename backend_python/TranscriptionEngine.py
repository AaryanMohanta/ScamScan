import os
import whisper

MODEL = whisper.load_model("base")

def transcribe(call_id: int) -> str:
    """
    Takes a call_id, loads tmp/{call_id}.wav, transcribes it,
    and returns the transcription as a string.
    """
    wav_path = f"tmp/{call_id}.m4a"

    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"Audio file not found: {wav_path}")

    result = MODEL.transcribe(wav_path)
    return result["text"].strip()


# Example usage
if __name__ == "__main__":
    text = transcribe(12345)
    print(text)