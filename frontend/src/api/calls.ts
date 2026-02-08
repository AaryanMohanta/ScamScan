// src/api/calls.ts
export type AnalyseResult = {
  transcript: string;
  scam_score: number;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  advice: string;
};

const API_BASE = "/api"; // using Vite proxy to http://localhost:8000

export async function uploadAudio(file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${API_BASE}/calls/upload`, {
    method: "POST",
    body: form,
  });
  if (!res.ok) {
    const msg = (await res.text().catch(() => "")) || res.statusText;
    throw new Error(`Upload failed: ${res.status} ${msg}`);
  }
  const data = await res.json();
  return data.call_id as string;
}

export async function analyseCall(
  callId: string,
  opts?: { phoneNumber?: string }
): Promise<AnalyseResult> {
  const res = await fetch(`${API_BASE}/calls/${callId}/analyse`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone_number: opts?.phoneNumber ?? null }),
  });
  if (!res.ok) {
    let detail = "";
    try {
      const j = await res.json();
      detail = j?.detail || "";
    } catch {}
    throw new Error(`Analyse failed: ${res.status} ${detail}`.trim());
  }
  return res.json();
}