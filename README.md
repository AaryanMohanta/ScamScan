# ScamScan

AI-powered scam detection for live phone calls. ScamScan monitors active calls in real-time, streams audio to an AI backend, and displays a floating risk alert on screen — automatically, as you talk.

It combines **speech-to-text AI**, **LLM-based scam analysis**, and **blockchain-stored call history** to produce a transparent, auditable scam-risk score.

---

## How It Works

```
Phone Call
    ↓
Android app captures audio (AudioRecord)
    ↓ WebSocket — PCM chunks every 10 seconds
FastAPI backend
    ↓                    ↓
OpenAI Whisper      Google Gemini
(transcription)     (scam classification)
    ↓
Risk result (Low / Medium / High + advice)
    ↓
Floating overlay on Android screen
    ↓
Blockchain (Ethereum Sepolia)
(permanent on-chain scam report)
```

Risk levels:
- `Low` — likely safe
- `Medium` — suspicious, proceed with caution
- `High` — probable scam, hang up

---

## Features

- **Live call monitoring** — automatically activates when a call starts, stops when it ends
- **Real-time transcription** — OpenAI Whisper processes 10-second audio windows
- **AI scam classification** — Google Gemini rates risk and gives caller-specific advice
- **Floating overlay** — non-intrusive widget shows risk level during the call
- **Blockchain reporting** — submit scam callers to an Ethereum Sepolia smart contract
- **Web dashboard** — upload recorded calls for post-call analysis
- **Full test suites** — 42 backend tests (pytest) + 43 frontend tests (Vitest)

---

## Project Structure

```
ScamScan/
├── backend/                    # FastAPI Python backend
│   ├── uploadCall.py           # REST + WebSocket endpoints
│   ├── live_call_ws.py         # Live audio WebSocket handler
│   ├── TranscriptionEngine.py  # Whisper transcription
│   ├── ScamAnalysisEngine.py   # Gemini scam classification
│   ├── blockchain/
│   │   └── scam_registry.py    # Web3 / Sepolia smart contract
│   ├── abi/                    # Contract ABI
│   └── tests/                  # pytest test suite (42 tests)
├── frontend/                   # React + TypeScript + Vite dashboard
│   └── src/
│       ├── pages/              # CallAnalysisPage
│       ├── components/         # FileUpload, AnalysisResult, ReportCallerForm
│       └── tests/              # Vitest test suite (43 tests)
├── android/                    # Native Kotlin Android app
│   └── app/src/main/java/com/scamscan/
│       ├── CallReceiver.kt         # BroadcastReceiver for call state
│       ├── CallMonitorService.kt   # Foreground service orchestrator
│       ├── AudioStreamManager.kt   # AudioRecord + WAV chunking
│       ├── WebSocketManager.kt     # OkHttp WebSocket client
│       ├── OverlayService.kt       # Floating overlay via WindowManager
│       └── MainActivity.kt         # Setup screen
└── contracts/
    └── ScamRegistry.sol        # Solidity smart contract
```

---

## Setup

### Requirements

- Python 3.12
- Node.js 18+
- Android Studio (for the Android app)
- An Ethereum Sepolia RPC URL (e.g. Infura/Alchemy)

### Environment Variables

Create `backend/.env`:

```env
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
RPC_URL=https://sepolia.infura.io/v3/your_project_id
PRIVATE_KEY=your_wallet_private_key
CONTRACT_ADDRESS=your_deployed_contract_address
CHAIN_ID=11155111
```

### Backend

```bash
cd backend
pip install -r requirements.txt
py -3.12 -m uvicorn uploadCall:app --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Android App

1. Open the `android/` folder in Android Studio
2. Build and run on an emulator or physical device (API 34+)
3. On first launch, enter the backend WebSocket URL (e.g. `ws://192.168.1.x:8000`)
4. Grant microphone, phone, and call log permissions

---

## Running Tests

**Backend (42 tests):**
```bash
cd backend
py -3.12 -m pytest
```

**Frontend (43 tests):**
```bash
cd frontend
npm test
```

---

## Android Permissions Required

| Permission | Purpose |
|------------|---------|
| `RECORD_AUDIO` | Capture call audio |
| `READ_PHONE_STATE` | Detect call state changes |
| `READ_CALL_LOG` | Access caller number |
| `SYSTEM_ALERT_WINDOW` | Draw floating overlay over call screen |
| `FOREGROUND_SERVICE_REMOTE_MESSAGING` | Keep service alive during call |
