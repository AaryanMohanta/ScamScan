# backend_python/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import secrets
from backend.TranscriptionEngine import transcribe
from backend.ScamAnalysisEngine import classify_call
from backend.blockchain.scam_registry import get_caller_stats, submit_caller_report
app = FastAPI(title="ScamScan Backend")

# CORS for local dev; adjust in prod
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = Path(__file__).resolve().parent
TMP_DIR = BASE_DIR / "tmp"
TMP_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTS = {".mp3", ".wav", ".m4a", ".ogg"}
MAX_SIZE = 50 * 1024 * 1024  # 50MB

@app.get("/api/health")
def health():
    return {"ok": True}

@app.post("/api/calls/upload")
async def upload_audio(file: UploadFile = File(...)):
    # Validate extension
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    call_id = secrets.token_hex(16)
    dest = TMP_DIR / f"{call_id}{ext}"

    # Stream to disk with size limit
    written = 0
    try:
        with dest.open("wb") as f:
            while True:
                chunk = await file.read(1024 * 1024)  # 1MB
                if not chunk:
                    break
                written += len(chunk)
                if written > MAX_SIZE:
                    raise HTTPException(status_code=413, detail="File too large.")
                f.write(chunk)
    except Exception:
        # Clean up partial file on error
        if dest.exists():
            try:
                dest.unlink()
            except OSError:
                pass
        raise

    return {"call_id": call_id, "filename": dest.name}

class AnalysePayload(BaseModel):
    phone_number: str | None = None

@app.post("/api/calls/{call_id}/analyse")
async def analyse_call(call_id: str, payload: AnalysePayload | None = None):
    # Find uploaded file by call_id
    matches = list(TMP_DIR.glob(f"{call_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="Audio not found for call_id.")
    audio_path = matches[0]

    if classify_call(transcribe(call_id), get_caller_stats(payload.phone_number)["total_reports"], get_caller_stats(payload.phone_number)["high_risk_reports"], get_caller_stats(payload.phone_number)["medium_risk_reports"]) == 0:
        quandale = "Low"
        submit_caller_report(payload.phone_number, 0)
    elif classify_call(transcribe(call_id), get_caller_stats(payload.phone_number)["total_reports"], get_caller_stats(payload.phone_number)["high_risk_reports"], get_caller_stats(payload.phone_number)["medium_risk_reports"]) == 1:
        quandale = "Medium"
        submit_caller_report(payload.phone_number, 1)
    else:
        quandale = "High"
        submit_caller_report(payload.phone_number, 2)


    # TODO: replace with real analysis
    return {
        "transcript": transcribe(call_id),
        "risk_level": quandale
    }