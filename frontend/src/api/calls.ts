// src/api/calls.ts
// TEMP MOCK VERSION – use this until the backend is ready

export interface AnalyseResult {
  transcript: string;
  scam_score: number;
  risk_level: string;
  advice: string;
}

export async function uploadAudio(file: File): Promise<string> {
  // pretend upload worked and return a fake callId
  console.log("Mock uploadAudio called with file:", file.name);
  return "mock-call-id-123";
}

export async function analyseCall(callId: string): Promise<AnalyseResult> {
  console.log("Mock analyseCall called with callId:", callId);
  // return fake analysis result
  return {
    transcript: "This is a mock transcript of your call.",
    scam_score: 0.82,
    risk_level: "HIGH",
    advice:
      "High likelihood of scam. Do not send money or share any codes. Hang up and contact your bank via official channels.",
  };
}

export async function reportCaller(callId: string, callerIdentifier: string): Promise<string | undefined> {
  console.log("Mock reportCaller called with", { callId, callerIdentifier });
  // pretend we submitted an on-chain report
  return "0xFAKE_TX_HASH_123";
}