// src/pages/CallAnalysisPage.tsx
import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import AnalysisResult from "../components/AnalysisResult";
import ReportCallerForm from "../components/ReportCallerForm";
import { uploadAudio, analyseCall } from "../api/calls";
import type { AnalyseResult } from "../api/calls";

type Tab = "number" | "audio";

const CallAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("audio");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [audioPhoneNumber, setAudioPhoneNumber] = useState("");
  const [callId, setCallId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const resetState = () => {
    setResult(null);
    setCallId(null);
    setError(undefined);
  };

  // Upload only; analysis happens when SCAN NOW is pressed
  const handleFileSelected = async (file: File) => {
    resetState();
    setLoading(true);
    try {
      const newCallId = await uploadAudio(file);
      setCallId(newCallId);
    } catch (err: any) {
      console.error(err);
      setError("Failed to upload audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumberScan = async (e: React.FormEvent) => {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      const mock: AnalyseResult = {
        transcript: `Number: ${phoneNumber}\n(Mock analysis – implement later.)`,
        scam_score: 0.75,
        risk_level: "HIGH",
        advice:
          "This number shows patterns consistent with scam call centres. Do not answer or share personal information.",
      };
      setResult(mock);
    } catch (err: any) {
      console.error(err);
      setError("Failed to analyse number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#0A192F", color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      {/* Header */}
      {/*... keep your header as-is... */}

      <main style={{ maxWidth: 1024, margin: "0 auto", padding: "3rem 1.5rem 4rem" }}>
        {/* Hero */}
        {/*... keep your hero as-is... */}

        <section
          style={{
            display: "grid",
            gridTemplateColumns: result ? "minmax(0, 1.15fr) minmax(0, 1.6fr)" : "minmax(0, 1fr)",
            gap: "2rem",
            alignItems: "stretch",
          }}
        >
          <div style={{ backgroundColor: "#0F2238", borderRadius: 16, padding: "1.8rem 1.6rem", boxShadow: "0 18px 40px rgba(0,0,0,0.4)" }}>
            {/* Tabs */}
            {/*... keep your tabs as-is... */}

            {activeTab === "number" ? (
              /*... number tab unchanged... */
              <form onSubmit={handleNumberScan}>
                {/*... */}
              </form>
            ) : (
              <div>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: "0.7rem", textAlign: "left" }}>
                  Upload call recording (.mp3,.wav)
                </p>
                <div
                  style={{
                    border: "1px dashed rgba(255,255,255,0.3)",
                    borderRadius: 16,
                    padding: "1.5rem 1rem",
                    marginBottom: "1rem",
                    textAlign: "center",
                    background: "linear-gradient(135deg, rgba(100,255,218,0.08), rgba(10,25,47,0.9))",
                  }}
                >
                  <FileUpload onFileSelected={handleFileSelected} />
                  {/* Small status helper */}
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: "0.5rem" }}>
                    {callId ? "File uploaded ✓" : "No file uploaded"}
                  </p>
                </div>

                <label style={{ display: "block", textAlign: "left", marginBottom: "0.4rem", fontSize: 13, color: "rgba(255,255,255,0.7)" }}>
                  Optional: Caller phone number
                </label>
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={audioPhoneNumber}
                  onChange={(e) => setAudioPhoneNumber(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.8rem",
                    borderRadius: 999,
                    border: "1px solid rgba(255,255,255,0.2)",
                    backgroundColor: "rgba(10,25,47,0.7)",
                    color: "white",
                    fontSize: 14,
                    marginBottom: "1rem",
                  }}
                />

                <button
                  type="button"
                  disabled={loading || !callId}
                  style={{
                    marginTop: "0.5rem",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 999,
                    border: "none",
                    background: loading || !callId ? "rgba(100,255,218,0.4)" : "#64FFDA",
                    color: "#0A192F",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    cursor: loading || !callId ? "default" : "pointer",
                    boxShadow: !loading && callId ? "0 0 18px rgba(100,255,218,0.4)" : "none",
                    transition: "all 0.15s ease",
                  }}
                  onClick={async () => {
                    if (!callId) return;
                    setLoading(true);
                    setError(undefined);
                    try {
                      const analysis = await analyseCall(callId, {
                        phoneNumber: audioPhoneNumber || undefined,
                      });
                      setResult(analysis);
                    } catch (err: any) {
                      console.error(err);
                      setError("Failed to analyse audio. Please try again.");
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  {loading ? "SCANNING..." : "SCAN NOW"}
                </button>
              </div>
            )}

            {loading && (
              <p style={{ marginTop: "0.8rem", fontSize: 12, color: "rgba(255,255,255,0.6)" }}>
                Checking databases… analysing patterns… verifying signals…
              </p>
            )}
            {error && (
              <p style={{ marginTop: "0.8rem", color: "#FF4C4C", fontSize: 13 }}>
                {error}
              </p>
            )}
          </div>

          {result && (
            <div>
              <AnalysisResult result={result} />
              {callId && result.risk_level === "HIGH" && (
                <ReportCallerForm callId={callId} riskLevel={result.risk_level} />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CallAnalysisPage;