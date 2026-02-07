// src/pages/CallAnalysisPage.tsx
import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import AnalysisResult from "../components/AnalysisResult";
import ReportCallerForm from "../components/ReportCallerForm";
import { uploadAudio, analyseCall } from "../api/calls";
import type { AnalyseResult } from "../api/calls";

const CallAnalysisPage: React.FC = () => {
  const [callId, setCallId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const handleFileSelected = async (file: File) => {
    setError(undefined);
    setResult(null);
    setCallId(null);
    setLoading(true);

    try {
      // 1. Upload audio to Python
      const newCallId = await uploadAudio(file);
      setCallId(newCallId);

      // 2. Ask Scala to analyse
      const analysis = await analyseCall(newCallId);
      setResult(analysis);
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyse call. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>AI Scam Call Detector</h1>
      <p>
        Upload a call recording and the system will transcribe it, analyse it for scam
        patterns, and provide a risk level and advice.
      </p>

      <FileUpload onFileSelected={handleFileSelected} />

      {loading && <p>Analysing call…</p>}
      {error && <p style={{ color: "red" }}>{error}</p>}

      {result && (
        <>
          <AnalysisResult result={result} />
          {callId && (
            <ReportCallerForm callId={callId} riskLevel={result.risk_level} />
          )}
        </>
      )}
    </div>
  );
};

export default CallAnalysisPage;