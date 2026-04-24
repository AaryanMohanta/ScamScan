// src/components/ReportCallerForm.tsx
import React, { useState } from "react";
import { reportCaller } from "../api/finalcalls";

interface ReportCallerFormProps {
  callId: string;
  riskLevel: string;
}

const ReportCallerForm: React.FC<ReportCallerFormProps> = ({ callId, riskLevel }) => {
  const [callerIdentifier, setCallerIdentifier] = useState("");
  const [txHash, setTxHash] = useState<string | undefined>();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | undefined>();

  if (riskLevel !== "HIGH") return null;

  const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setTxHash(undefined);
    try {
      const hash = await reportCaller(callId, callerIdentifier);
      setTxHash(hash);
    } catch (err: any) {
      setError("Failed to submit report. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (txHash) {
    return (
      <div style={{
        background: "var(--safe-dim)",
        border: "1px solid rgba(52,211,153,0.2)",
        borderRadius: 16,
        padding: "16px 20px",
        display: "flex", flexDirection: "column", gap: 6,
      }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--safe)" }}>
          ✓ Reported to blockchain
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)", wordBreak: "break-all" }}>
          Tx: {txHash}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: "rgba(255,77,106,0.07)",
      border: "1px solid rgba(255,77,106,0.2)",
      borderRadius: 16,
      padding: "20px",
      display: "flex", flexDirection: "column", gap: 14,
      backdropFilter: "blur(12px)",
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--danger)", marginBottom: 4 }}>
          🚨 Report this caller
        </div>
        <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.55 }}>
          Submit this number to the on-chain scam registry to protect others.
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <input
          type="text"
          placeholder="Phone number or identifier"
          value={callerIdentifier}
          onChange={(e) => setCallerIdentifier(e.target.value)}
          required
          style={{
            background: "rgba(15,10,30,0.7)",
            border: "1px solid rgba(255,77,106,0.25)",
            borderRadius: 999,
            padding: "10px 16px",
            fontSize: 14,
            color: "var(--text)",
            outline: "none",
            width: "100%",
          }}
        />
        {error && <div style={{ fontSize: 12, color: "var(--danger)" }}>{error}</div>}
        <button
          type="submit"
          disabled={loading || !callerIdentifier}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 999,
            border: "1.5px solid rgba(255,77,106,0.45)",
            background: "transparent",
            color: "var(--danger)",
            fontSize: 14,
            fontWeight: 600,
            opacity: loading || !callerIdentifier ? 0.45 : 1,
            cursor: loading || !callerIdentifier ? "default" : "pointer",
            transition: "opacity 0.15s",
          }}
        >
          {loading ? "Submitting…" : "Report to Blockchain"}
        </button>
      </form>
    </div>
  );
};

export default ReportCallerForm;
