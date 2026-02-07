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

  if (riskLevel !== "HIGH") {
    return null; // only show if HIGH risk
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(undefined);
    setTxHash(undefined);

    try {
      const hash = await reportCaller(callId, callerIdentifier);
      setTxHash(hash);
    } catch (err: any) {
      setError("Failed to report caller.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>Report this caller</h3>
      <p>
        This call was flagged as high risk. You can report the caller (e.g. a phone number
        or identifier) to the on-chain scam registry.
      </p>

      <form onSubmit={handleSubmit}>
        <label>
          Caller identifier (e.g. phone number):
          <input
            type="text"
            value={callerIdentifier}
            onChange={(e) => setCallerIdentifier(e.target.value)}
            required
            style={{ marginLeft: "0.5rem" }}
          />
        </label>
        <button type="submit" disabled={loading} style={{ marginLeft: "1rem" }}>
          {loading ? "Reporting..." : "Report caller"}
        </button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {txHash && (
        <p>
          Report submitted. Tx hash: <code>{txHash}</code>
        </p>
      )}
    </div>
  );
};

export default ReportCallerForm;