import os
import whisper

MODEL = whisper.load_model("base")

def transcribe(call_id: int) -> str:
    """
    Takes a call_id, loads tmp/{call_id}.wav, transcribes it,
    and returns the transcription as a string.
    """
    if os.path.exists(f"tmp/{call_id}.m4a"):
        wav_path = f"tmp/{call_id}.m4a"
    elif os.path.exists(f"tmp/{call_id}.mp3"):
        wav_path = f"tmp/{call_id}.mp3"
    elif os.path.exists(f"tmp/{call_id}.wav"):
        wav_path = f"tmp/{call_id}.wav"
    elif os.path.exists(f"tmp/{call_id}.ogg"):
        wav_path = f"tmp/{call_id}.ogg"
    else:
        raise FileNotFoundError(f"Audio file not found: {call_id}")

    result = MODEL.transcribe(wav_path)
    return result["text"].strip()


# Example usage
if __name__ == "__main__":
    text = transcribe(12345)
    print(text)