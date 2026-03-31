// src/pages/CallAnalysisPage.tsx
import React, { useState } from "react";
import FileUpload from "../components/FileUpload";
import AnalysisResult from "../components/AnalysisResult";
import ReportCallerForm from "../components/ReportCallerForm";
import { uploadAudio, analyseCall } from "../api/calls";
import type { AnalyseResult } from "../api/calls";

type Tab = "audio" | "number";

const CallAnalysisPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>("audio");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [audioPhoneNumber, setAudioPhoneNumber] = useState("");
  const [callId, setCallId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyseResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [audioPhoneError, setAudioPhoneError] = useState<string | undefined>();

  const resetState = () => {
    setResult(null);
    setCallId(null);
    setError(undefined);
    setAudioPhoneError(undefined);
  };

  const handleFileSelected = async (file: File) => {
    resetState();
    setLoading(true);
    try {
      const newCallId = await uploadAudio(file);
      setCallId(newCallId);
    } catch {
      setError("Failed to upload audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNumberScan = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetState();
    setLoading(true);
    try {
      const mock: AnalyseResult = {
        transcript: `Number: ${phoneNumber}\n(Mock analysis – implement later.)`,
        scam_score: 0.75,
        risk_level: "HIGH",
        advice: "This number shows patterns consistent with scam call centres. Do not answer or share personal information.",
      };
      setResult(mock);
    } catch {
      setError("Failed to analyse number. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAudioScan = async () => {
    if (!callId) return;
    if (!audioPhoneNumber.trim()) {
      setAudioPhoneError("Please enter the caller's phone number before scanning.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      const analysis = await analyseCall(callId, { phoneNumber: audioPhoneNumber.trim() });
      setResult(analysis);
    } catch {
      setError("Failed to analyse audio. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--text)", fontFamily: "var(--font)" }}>

      {/* Ambient background orbs */}
      <div style={{ position: "fixed", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position: "absolute", top: "-20%", left: "15%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", top: "40%", right: "-10%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(236,72,153,0.08) 0%, transparent 70%)",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "30%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)",
        }} />
      </div>

      {/* ── Header ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 80px", height: 68,
        background: "rgba(15,10,30,0.8)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(139,92,246,0.12)",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: "var(--accent-grad)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 14, color: "#fff",
            boxShadow: "0 0 16px rgba(139,92,246,0.5)",
          }}>S</div>
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "0.04em", background: "var(--accent-grad)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            ScamScan
          </span>
        </div>

        {/* Nav */}
        <nav style={{ display: "flex", gap: 36 }}>
          {["Features", "How it Works", "API Docs"].map(l => (
            <button key={l} style={{
              background: "none", border: "none",
              color: "var(--text-muted)", fontSize: 14, fontWeight: 500,
              cursor: "pointer", padding: 0,
              transition: "color 0.15s",
            }}>{l}</button>
          ))}
        </nav>

        {/* Right */}
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 14, cursor: "pointer", padding: 0 }}>
            Login
          </button>
          <button style={{
            background: "var(--accent-grad)", border: "none",
            borderRadius: 999, padding: "8px 22px",
            fontSize: 13, fontWeight: 700, color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(139,92,246,0.35)",
          }}>
            Get Started
          </button>
        </div>
      </header>

      <main style={{ position: "relative", zIndex: 1, maxWidth: 1200, margin: "0 auto", padding: "0 60px 80px" }}>

        {/* ── Hero ── */}
        <section style={{ textAlign: "center", padding: "80px 0 56px" }}>

          {/* Badge */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(139,92,246,0.1)",
            border: "1px solid rgba(139,92,246,0.3)",
            borderRadius: 999, padding: "6px 18px", marginBottom: 32,
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "var(--accent)",
              boxShadow: "0 0 6px var(--accent)",
              display: "inline-block",
            }} />
            <span style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", letterSpacing: "0.04em" }}>
              AI-Powered Scam Detection
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize: "clamp(2.4rem, 5vw, 4.2rem)",
            fontWeight: 900,
            letterSpacing: "-0.03em",
            lineHeight: 1.08,
            margin: "0 0 22px",
            background: "linear-gradient(135deg, #F0EBFF 0%, #C4B5FD 50%, #EC4899 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}>
            Is that call safe?<br />Verify it instantly.
          </h1>

          {/* Subtitle */}
          <p style={{
            fontSize: 17, lineHeight: 1.75, color: "var(--text-muted)",
            maxWidth: 520, margin: "0 auto 48px",
          }}>
            AI-powered risk analysis for audio recordings and phone numbers,
            backed by real-time blockchain verification.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
            {[
              { value: "2.4M+", label: "Calls Analyzed" },
              { value: "98.7%", label: "Accuracy Rate" },
              { value: "<2s", label: "Analysis Time" },
            ].map((stat, i, arr) => (
              <React.Fragment key={stat.label}>
                <div style={{ padding: "0 44px", textAlign: "center" }}>
                  <div style={{
                    fontSize: 26, fontWeight: 900, lineHeight: 1,
                    background: "var(--accent-grad)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {stat.value}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 5 }}>
                    {stat.label}
                  </div>
                </div>
                {i < arr.length - 1 && (
                  <div style={{ width: 1, height: 36, background: "rgba(139,92,246,0.2)" }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* ── Scanner + Result grid ── */}
        <section style={{
          display: "grid",
          gridTemplateColumns: result ? "minmax(0,1fr) minmax(0,1.3fr)" : "minmax(0,520px)",
          justifyContent: result ? "stretch" : "center",
          gap: 24,
          alignItems: "start",
        }}>

          {/* ── Input card ── */}
          <div style={{
            background: "var(--surface-glass)",
            backdropFilter: "blur(24px)",
            WebkitBackdropFilter: "blur(24px)",
            border: "1px solid rgba(139,92,246,0.18)",
            borderRadius: 22,
            padding: 28,
            boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 0 1px rgba(139,92,246,0.05) inset",
            display: "flex", flexDirection: "column", gap: 20,
          }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text)" }}>Scan a Call</div>

            {/* Tabs */}
            <div style={{
              display: "flex",
              background: "rgba(15,10,30,0.6)",
              borderRadius: 999, padding: 4, gap: 4,
              border: "1px solid var(--border)",
            }}>
              {(["audio", "number"] as Tab[]).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); resetState(); }}
                  style={{
                    flex: 1,
                    padding: "9px 12px",
                    borderRadius: 999, border: "none",
                    fontSize: 13, fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    background: activeTab === tab ? "var(--accent-grad)" : "transparent",
                    color: activeTab === tab ? "#fff" : "var(--text-muted)",
                    boxShadow: activeTab === tab ? "0 0 16px rgba(139,92,246,0.35)" : "none",
                  }}
                >
                  {tab === "audio" ? "🎙️  Analyze Audio" : "📱  Check Number"}
                </button>
              ))}
            </div>

            {/* Audio tab */}
            {activeTab === "audio" ? (
              <>
                <FileUpload onFileSelected={handleFileSelected} />

                {callId && (
                  <div style={{
                    fontSize: 13, color: "var(--safe)", fontWeight: 600,
                    display: "flex", alignItems: "center", gap: 6,
                    background: "var(--safe-dim)",
                    border: "1px solid rgba(52,211,153,0.2)",
                    borderRadius: 10, padding: "8px 14px",
                  }}>
                    <span>✓</span> File uploaded — ready to scan
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                    Caller's Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={audioPhoneNumber}
                    onChange={(e) => { setAudioPhoneNumber(e.target.value); if (audioPhoneError) setAudioPhoneError(undefined); }}
                    style={{
                      background: "rgba(15,10,30,0.7)",
                      border: `1px solid ${audioPhoneError ? "var(--danger)" : "var(--border)"}`,
                      borderRadius: 999, padding: "11px 18px",
                      fontSize: 14, color: "var(--text)", outline: "none", width: "100%",
                    }}
                  />
                  {audioPhoneError && (
                    <div style={{ fontSize: 12, color: "var(--danger)" }}>{audioPhoneError}</div>
                  )}
                </div>

                <button
                  disabled={loading || !callId}
                  onClick={handleAudioScan}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 999, border: "none",
                    background: loading || !callId ? "rgba(139,92,246,0.3)" : "var(--accent-grad)",
                    color: "#fff", fontSize: 14, fontWeight: 800,
                    letterSpacing: "0.08em",
                    cursor: loading || !callId ? "default" : "pointer",
                    boxShadow: !loading && callId ? "0 0 28px rgba(139,92,246,0.5)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? "SCANNING…" : "SCAN NOW"}
                </button>
              </>
            ) : (
              /* Number tab */
              <form onSubmit={handleNumberScan} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <label style={{ fontSize: 13, fontWeight: 500, color: "var(--text-muted)" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 555 123 4567"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                    style={{
                      background: "rgba(15,10,30,0.7)",
                      border: "1px solid var(--border)",
                      borderRadius: 999, padding: "11px 18px",
                      fontSize: 14, color: "var(--text)", outline: "none", width: "100%",
                    }}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || !phoneNumber}
                  style={{
                    width: "100%", padding: "14px", borderRadius: 999, border: "none",
                    background: loading || !phoneNumber ? "rgba(139,92,246,0.3)" : "var(--accent-grad)",
                    color: "#fff", fontSize: 14, fontWeight: 800,
                    letterSpacing: "0.08em",
                    cursor: loading || !phoneNumber ? "default" : "pointer",
                    boxShadow: !loading && phoneNumber ? "0 0 28px rgba(139,92,246,0.5)" : "none",
                    transition: "all 0.2s ease",
                  }}
                >
                  {loading ? "SCANNING…" : "SCAN NOW"}
                </button>
              </form>
            )}

            {loading && (
              <p style={{ margin: 0, fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>
                Transcribing · analysing patterns · checking blockchain…
              </p>
            )}
            {error && (
              <p style={{ margin: 0, fontSize: 13, color: "var(--danger)" }}>{error}</p>
            )}
          </div>

          {/* Result panel */}
          {result && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <AnalysisResult result={result} />
              {callId && result.risk_level.toUpperCase() === "HIGH" && (
                <ReportCallerForm callId={callId} riskLevel="HIGH" />
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default CallAnalysisPage;
