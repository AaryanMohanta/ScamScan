# backend_python/main.py
from fastapi import FastAPI, UploadFile, File, HTTPException, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from pathlib import Path
import secrets
from TranscriptionEngine import transcribe
from ScamAnalysisEngine import classify_call
from blockchain.scam_registry import get_caller_stats, submit_caller_report
from live_call_ws import live_call_ws

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

_RISK_SCORE = {"Low": 0.15, "Medium": 0.55, "High": 0.90}
_RISK_ADVICE = {
    "Low": "No threats detected. This call appears consistent with normal behaviour.",
    "Medium": "Proceed with caution. Some language resembles common spam or social-engineering attempts.",
    "High": "Do not engage. This call matches patterns from known scam scripts, including high-pressure tactics and requests for sensitive information.",
}


@app.websocket("/ws/live-call")
async def websocket_live_call(websocket: WebSocket, phone_number: str = ""):
    await live_call_ws(websocket, phone_number)


@app.get("/api/health")
def health():
    return {"ok": True}


@app.post("/api/calls/upload")
async def upload_audio(file: UploadFile = File(...)):
    ext = Path(file.filename or "").suffix.lower()
    if ext not in ALLOWED_EXTS:
        raise HTTPException(status_code=400, detail="Unsupported file type.")

    call_id = secrets.token_hex(16)
    dest = TMP_DIR / f"{call_id}{ext}"

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
async def analyse_call(call_id: str, payload: AnalysePayload = AnalysePayload()):
    matches = list(TMP_DIR.glob(f"{call_id}.*"))
    if not matches:
        raise HTTPException(status_code=404, detail="Audio not found for call_id.")

    phone_number = payload.phone_number

    transcript = transcribe(call_id)

    stats = get_caller_stats(phone_number) if phone_number else {"total_reports": 0, "high_risk_reports": 0, "medium_risk_reports": 0}
    risk_int = int(classify_call(
        transcript,
        stats["total_reports"],
        stats["medium_risk_reports"],
        stats["high_risk_reports"],
    ))

    if risk_int == 0:
        risk_level = "Low"
    elif risk_int == 1:
        risk_level = "Medium"
    else:
        risk_level = "High"

    if phone_number:
        submit_caller_report(phone_number, risk_int)

    return {
        "transcript": transcript,
        "risk_level": risk_level,
        "scam_score": _RISK_SCORE[risk_level],
        "advice": _RISK_ADVICE[risk_level],
    }
