import os
import whisper

MODEL = whisper.load_model("base")

def transcribe(call_id):
    """
    Takes a call_id, loads tmp/{call_id}.wav, transcribes it,
    and returns the transcription as a string.
    """
    print(f"tmp/{call_id}.wav")
    print("hi")
    print(os.getcwd())
    if os.path.exists(f"backend/tmp/{call_id}.m4a"):
        print("1")
        wav_path = f"tmp/{call_id}.m4a"
    elif os.path.exists(f"backend/tmp/{call_id}.mp3"):
        wav_path = f"tmp/{call_id}.mp3"
    elif os.path.exists(f"backend/tmp/{call_id}.wav"):
        wav_path = f"backend/tmp/{call_id}.wav"
        print("1")
    elif os.path.exists(f"backend/tmp/{call_id}.ogg"):
        wav_path = f"tmp/{call_id}.ogg"
    else:
        raise FileNotFoundError(f"Audio file not found: {call_id}")
    
    print("12")
    result = MODEL.transcribe(r"C:\Users\m_bha\ScamScan\backend\tmp\HighRisk.m4a")
    return result["text"].strip()


# Example usage
if __name__ == "__main__":
    text = transcribe("94cf8c56042daba52dcbed3bbf876a37")
    print(text)