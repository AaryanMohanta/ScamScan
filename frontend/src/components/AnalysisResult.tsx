// src/components/AnalysisResult.tsx
import React from "react";
import type { AnalyseResult } from "../api/calls";

interface Props {
  result: AnalyseResult;
}

const LEVEL_CONFIG = {
  LOW: {
    label: "Safe / Verified",
    emoji: "🛡️",
    color: "var(--safe)",
    dim: "var(--safe-dim)",
    border: "rgba(52,211,153,0.2)",
    glow: "rgba(52,211,153,0.08)",
  },
  MEDIUM: {
    label: "Potentially Suspicious",
    emoji: "👁️",
    color: "var(--warning)",
    dim: "var(--warning-dim)",
    border: "rgba(255,176,32,0.2)",
    glow: "rgba(255,176,32,0.08)",
  },
  HIGH: {
    label: "Critical Threat",
    emoji: "⚠️",
    color: "var(--danger)",
    dim: "var(--danger-dim)",
    border: "rgba(255,77,106,0.25)",
    glow: "rgba(255,77,106,0.1)",
  },
};

const AnalysisResult: React.FC<Props> = ({ result }) => {
  const { scam_score, risk_level, transcript, advice } = result;
  const level = (risk_level || "LOW").toUpperCase() as keyof typeof LEVEL_CONFIG;
  const cfg = LEVEL_CONFIG[level] ?? LEVEL_CONFIG.LOW;
  const scorePercent = Math.round((scam_score ?? 0) * 100);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

      {/* Verdict card */}
      <div style={{
        background: "var(--surface-glass)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        border: `1px solid ${cfg.border}`,
        borderRadius: 20,
        padding: "28px 26px",
        boxShadow: `0 0 60px ${cfg.glow}, 0 20px 40px rgba(0,0,0,0.35)`,
      }}>
        {/* Top row: emoji + label */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: cfg.dim,
            border: `1px solid ${cfg.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24,
          }}>
            {cfg.emoji}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 4 }}>
              Risk Assessment
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, letterSpacing: "-0.02em" }}>
              {cfg.label}
            </div>
          </div>
        </div>

        {/* Advice */}
        {advice && (
          <p style={{ fontSize: 14, lineHeight: 1.65, color: "var(--text-muted)", margin: "0 0 20px" }}>
            {advice}
          </p>
        )}

        {/* Score bar */}
        <div style={{ marginBottom: 18 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
            <span style={{ fontSize: 12, color: "var(--text-muted)", fontWeight: 500 }}>Scam Probability</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{scorePercent}%</span>
          </div>
          <div style={{
            height: 6, borderRadius: 999,
            background: "rgba(255,255,255,0.06)",
            overflow: "hidden",
          }}>
            <div style={{
              height: "100%",
              width: `${scorePercent}%`,
              borderRadius: 999,
              background: cfg.color,
              boxShadow: `0 0 8px ${cfg.color}`,
              transition: "width 0.8s ease",
            }} />
          </div>
        </div>

        {/* Pills */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Pill label={`Score: ${scorePercent}/100`} active color={cfg.color} />
          <Pill label={`Verdict: ${level}`} color={cfg.color} />
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div style={{
          background: "var(--surface-glass)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          borderRadius: 16,
          padding: "16px 18px",
        }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.1em",
            color: "var(--text-muted)", textTransform: "uppercase", marginBottom: 10,
          }}>
            Call Transcript
          </div>
          <p style={{
            fontSize: 13, lineHeight: 1.7, color: "rgba(240,235,255,0.8)",
            margin: 0, whiteSpace: "pre-wrap",
            fontFamily: "var(--mono)",
            maxHeight: 180, overflowY: "auto",
          }}>
            {transcript}
          </p>
        </div>
      )}
    </div>
  );
};

const Pill: React.FC<{ label: string; color: string; active?: boolean }> = ({ label, color, active }) => (
  <span style={{
    display: "inline-block",
    padding: "5px 13px",
    borderRadius: 999,
    fontSize: 11,
    fontWeight: 700,
    letterSpacing: "0.06em",
    background: active ? `${color}22` : "rgba(255,255,255,0.05)",
    border: `1px solid ${active ? `${color}44` : "rgba(255,255,255,0.07)"}`,
    color: active ? color : "var(--text-muted)",
  }}>
    {label}
  </span>
);

export default AnalysisResult;
