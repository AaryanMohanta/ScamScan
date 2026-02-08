# 📞 ScamScan  
**AI-Powered Scam Call Detection with Blockchain-Backed Trust Signals**

ScamScan is a full-stack system designed to assess the likelihood that a phone call is a scam.  
It combines **speech-to-text AI**, **LLM-based scam analysis**, and **blockchain-stored call history** to produce a transparent, auditable scam-risk score for phone calls.

---

## 🚀 Overview

ScamScan analyzes incoming phone calls by:
1. Transcribing call audio into text using **OpenAI Whisper**
2. Evaluating the transcript with a **scam analysis engine powered by Gemini**
3. Incorporating **historical call data stored on-chain**
4. Producing a simple, interpretable risk score:
   - `0` → Low likelihood of scam
   - `1` → Medium likelihood of scam
   - `2` → High likelihood of scam

The result is a system that is **data-driven**, **explainable**, and **tamper-resistant**.

---

## 🧠 System Architecture

```text
┌────────────┐
│  Frontend  │  (React Web App)
└─────┬──────┘
      │  Audio Upload / API Calls
      ▼
┌────────────┐
│  Backend   │  (FastAPI / Python)
│            │
│  • Whisper │ → Transcription
│  • Gemini  │ → Scam Classification
└─────┬──────┘
      │  Historical Signals
      ▼
┌────────────┐
│ Blockchain │  (Smart Contracts)
│            │
│  • Call Logs
│  • Scam Flags
└────────────┘
