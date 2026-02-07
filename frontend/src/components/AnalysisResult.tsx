// src/components/AnalysisResult.tsx
import React from "react";
import type { AnalyseResult } from "../api/finalcalls";

interface AnalysisResultProps {
  result: AnalyseResult;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ result }) => {
  const { transcript, scam_score, risk_level, advice } = result;

  const riskColor =
    risk_level === "HIGH" ? "red" : risk_level === "MEDIUM" ? "orange" : "green";

  return (
    <div style={{ marginTop: "1rem" }}>
      <h2>Analysis Result</h2>

      <div>
        <strong>Risk level: </strong>
        <span style={{ color: riskColor }}>{risk_level}</span>
      </div>
      <div>
        <strong>Scam score: </strong>
        {Math.round(scam_score * 100)} / 100
      </div>

      <div style={{ marginTop: "1rem" }}>
        <strong>Advice:</strong>
        <p>{advice}</p>
      </div>

      <div style={{ marginTop: "1rem" }}>
        <strong>Transcript:</strong>
        <p style={{ whiteSpace: "pre-wrap" }}>{transcript}</p>
      </div>
    </div>
  );
};

export default AnalysisResult;