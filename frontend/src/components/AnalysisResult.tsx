// src/components/AnalysisResult.tsx
import React from "react";
import type { AnalyseResult } from "../api/calls";

interface Props {
  result: AnalyseResult;
}

const AnalysisResult: React.FC<Props> = ({ result }) => {
  const { scam_score, risk_level, transcript } = result;
  const scorePercent = Math.round(scam_score * 100);

  // Determine state from score
  let containerBg = "#E8F5E9"; // low default
  let borderColor = "#388E3C";
  let headlineColor = "#388E3C";
  let headlineText = "SAFE / VERIFIED";
  let explanationText =
    "No threats detected. This number appears consistent with normal behaviour and there is no history of spam reports.";
  let emoji = "🛡️";

  if (scorePercent >= 75) {
    // High risk
    containerBg = "#FFF5F5";
    borderColor = "#D32F2F";
    headlineColor = "#D32F2F";
    headlineText = "CRITICAL THREAT";
    explanationText =
      "Do not engage. This call matches patterns from known scam scripts, including high-pressure tactics and requests for sensitive information.";
    emoji = "⚠️";
  } else if (scorePercent >= 30) {
    // Medium risk
    containerBg = "#FFF8E1";
    borderColor = "#F57C00";
    headlineColor = "#F57C00";
    headlineText = "POTENTIALLY SUSPICIOUS";
    explanationText =
      "Proceed with caution. Some language and behaviour in this call resemble common spam or social engineering attempts.";
    emoji = "👁️";
  }

  return (
    <section
      style={{
        // Hero section wrapper
        background: "transparent",
        color: "#111827",
        fontFamily: "Inter, system-ui, sans-serif",
      }}
    >
      {/* Hero verdict block */}
      <div
        style={{
          backgroundColor: containerBg,
          borderRadius: 24,
          border: `3px solid ${borderColor}`,
          padding: "2.5rem 2rem",
          textAlign: "center",
          boxShadow: "0 18px 40px rgba(0,0,0,0.25)",
        }}
      >
        {/* Optional icon */}
        <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>{emoji}</div>

        {/* Big verdict text */}
        <h2
          style={{
            fontSize: "3rem",
            fontWeight: 900,
            letterSpacing: "-0.02em",
            margin: "0 0 1rem",
            textTransform: "uppercase",
            color: headlineColor,
          }}
        >
          {headlineText}
        </h2>

        {/* Explanation text */}
        <p
          style={{
            fontSize: "1.125rem",
            lineHeight: 1.6,
            color: "#374151",
            maxWidth: 600,
            margin: "0 auto 1.5rem",
          }}
        >
          {explanationText}
        </p>

        {/* Small meta info: score + level */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "1.25rem",
            flexWrap: "wrap",
            fontSize: 13,
            color: "#4B5563",
          }}
        >
          <span
            style={{
              padding: "0.25rem 0.7rem",
              borderRadius: 999,
              backgroundColor: "rgba(15, 23, 42, 0.06)",
              fontFamily: "JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas",
            }}
          >
            SCORE: {scorePercent}/100
          </span>
          <span
            style={{
              padding: "0.25rem 0.7rem",
              borderRadius: 999,
              backgroundColor: "rgba(15, 23, 42, 0.06)",
              textTransform: "uppercase",
            }}
          >
            Model verdict: {risk_level}
          </span>
        </div>
      </div>

      {/* OPTIONAL: Transcript preview below hero */}
      {transcript && (
        <div
          style={{
            marginTop: "1.75rem",
            backgroundColor: "#0F2238",
            borderRadius: 16,
            padding: "1.25rem 1.5rem",
            color: "white",
            maxHeight: 220,
            overflowY: "auto",
            border: "1px solid rgba(255,255,255,0.12)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
              fontSize: 13,
              color: "rgba(255,255,255,0.76)",
            }}
          >
            <span>Call Transcript (preview)</span>
          </div>
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              whiteSpace: "pre-wrap",
              color: "rgba(249,250,251,0.9)",
            }}
          >
            {transcript}
          </p>
        </div>
      )}
    </section>
  );
};

export default AnalysisResult;