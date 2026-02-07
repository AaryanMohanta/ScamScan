// src/api/calls.ts
import { pythonClient, scalaClient } from "./apiClient";

export interface AnalyseResult {
  transcript: string;
  scam_score: number;
  risk_level: string;
  advice: string;
}

export async function uploadAudio(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await pythonClient.post("/audio/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  // Python returns { call_id: "..." }
  return res.data.call_id as string;
}

export async function analyseCall(callId: string): Promise<AnalyseResult> {
  const res = await scalaClient.post("/api/call/analyse", {
    callId,
  });

  // Scala returns JSON with transcript, scam_score, risk_level, advice
  return res.data as AnalyseResult;
}

export async function reportCaller(callId: string, callerIdentifier: string): Promise<string | undefined> {
  const res = await scalaClient.post("/api/call/report", {
    callId,
    callerIdentifier,
  });

  // Expect { tx_hash: string } or similar
  return res.data.tx_hash as string | undefined;
}