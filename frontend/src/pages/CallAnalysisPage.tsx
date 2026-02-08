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
      // TODO: replace with real number-analysis API
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
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#0A192F",
        color: "white",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "1rem 2rem",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: "50%",
              border: "2px solid #64FFDA",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
              fontSize: 14,
            }}
          >
            S
          </div>
          <span style={{ fontWeight: 700, letterSpacing: "0.08em" }}>
            ScamScan
          </span>
        </div>

        <nav style={{ display: "flex", gap: "1.5rem", fontSize: 14 }}>
          <button
            style={{
              background: "transparent",
              border: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            Login
          </button>
          <button
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: 999,
              padding: "0.3rem 0.9rem",
              color: "white",
              cursor: "pointer",
              fontSize: 13,
            }}
          >
            API Docs
          </button>
        </nav>
      </header>

      {/* Main */}
      <main
        style={{
          maxWidth: 1024,
          margin: "0 auto",
          padding: "3rem 1.5rem 4rem",
        }}
      >
        {/* Hero */}
        <section style={{ textAlign: "center", marginBottom: "2.5rem" }}>
          <h1
            style={{
              fontSize: "2.4rem",
              marginBottom: "0.8rem",
              fontWeight: 700,
            }}
          >
            Is that call safe? Verify it instantly.
          </h1>
          <p
            style={{
              fontSize: "0.98rem",
              color: "rgba(255,255,255,0.75)",
              maxWidth: 520,
              margin: "0 auto",
            }}
          >
            AI-powered risk analysis for audio recordings and phone numbers.
          </p>
        </section>

        {/* Input + Result grid */}
        <section
          style={{
            display: "grid",
            gridTemplateColumns: result
              ? "minmax(0, 1.15fr) minmax(0, 1.6fr)"
              : "minmax(0, 1fr)",
            gap: "2rem",
            alignItems: "stretch",
          }}
        >
          {/* Input card */}
          <div
            style={{
              backgroundColor: "#0F2238",
              borderRadius: 16,
              padding: "1.8rem 1.6rem",
              boxShadow: "0 18px 40px rgba(0,0,0,0.4)",
            }}
          >
            {/* Tabs */}
            <div
              style={{
                display: "flex",
                marginBottom: "1.5rem",
                borderRadius: 999,
                padding: 4,
                backgroundColor: "rgba(15,35,60,0.9)",
              }}
            >
              <button
                onClick={() => {
                  setActiveTab("number");
                  resetState();
                }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "0.5rem 0.8rem",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor:
                    activeTab === "number" ? "#64FFDA" : "transparent",
                  color: activeTab === "number" ? "#0A192F" : "#ffffff",
                  transition: "all 0.15s ease",
                }}
              >
                Check Number
              </button>
              <button
                onClick={() => {
                  setActiveTab("audio");
                  resetState();
                }}
                style={{
                  flex: 1,
                  borderRadius: 999,
                  border: "none",
                  padding: "0.5rem 0.8rem",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 500,
                  backgroundColor:
                    activeTab === "audio" ? "#64FFDA" : "transparent",
                  color: activeTab === "audio" ? "#0A192F" : "#ffffff",
                  transition: "all 0.15s ease",
                }}
              >
                Analyze Audio
              </button>
            </div>

            {/* Tab content */}
            {activeTab === "number" ? (
              <form onSubmit={handleNumberScan}>
                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    marginBottom: "0.4rem",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="+1 555 123 4567"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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
                  required
                />

                <button
                  type="submit"
                  disabled={loading || !phoneNumber}
                  style={{
                    marginTop: "0.5rem",
                    width: "100%",
                    padding: "0.75rem",
                    borderRadius: 999,
                    border: "none",
                    background:
                      loading || !phoneNumber
                        ? "rgba(100,255,218,0.4)"
                        : "#64FFDA",
                    color: "#0A192F",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    cursor: loading || !phoneNumber ? "default" : "pointer",
                    boxShadow:
                      !loading && phoneNumber
                        ? "0 0 18px rgba(100,255,218,0.4)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                >
                  {loading ? "SCANNING..." : "SCAN NOW"}
                </button>
              </form>
            ) : (
              <div>
                <p
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                    marginBottom: "0.7rem",
                    textAlign: "left",
                  }}
                >
                  Upload call recording (.mp3,.wav)
                </p>
                <div
                  style={{
                    border: "1px dashed rgba(255,255,255,0.3)",
                    borderRadius: 16,
                    padding: "1.5rem 1rem",
                    marginBottom: "1rem",
                    textAlign: "center",
                    background:
                      "linear-gradient(135deg, rgba(100,255,218,0.08), rgba(10,25,47,0.9))",
                  }}
                >
                  <FileUpload onFileSelected={handleFileSelected} />
                  <p
                    style={{
                      fontSize: 12,
                      color: "rgba(255,255,255,0.6)",
                      marginTop: "0.5rem",
                    }}
                  >
                    {callId ? "File uploaded ✓" : "No file uploaded"}
                  </p>
                </div>

                <label
                  style={{
                    display: "block",
                    textAlign: "left",
                    marginBottom: "0.4rem",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
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
                    background:
                      loading || !callId
                        ? "rgba(100,255,218,0.4)"
                        : "#64FFDA",
                    color: "#0A192F",
                    fontWeight: 600,
                    letterSpacing: "0.05em",
                    cursor: loading || !callId ? "default" : "pointer",
                    boxShadow:
                      !loading && callId
                        ? "0 0 18px rgba(100,255,218,0.4)"
                        : "none",
                    transition: "all 0.15s ease",
                  }}
                  onClick={async () => {
                    if (!callId) return;
                    setLoading(true);
                    setError(undefined);
                    try {
                      // For now, we ignore audioPhoneNumber in the call;
                      // later you can extend analyseCall(...) to accept it.
                      const analysis = await analyseCall(callId);
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
              <p
                style={{
                  marginTop: "0.8rem",
                  fontSize: 12,
                  color: "rgba(255,255,255,0.6)",
                }}
              >
                Checking databases… analysing patterns… verifying signals…
              </p>
            )}
            {error && (
              <p
                style={{
                  marginTop: "0.8rem",
                  color: "#FF4C4C",
                  fontSize: 13,
                }}
              >
                {error}
              </p>
            )}
          </div>

          {/* Result panel */}
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