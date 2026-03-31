// src/pages/ThemePreview.tsx
// Visit /?theme-picker to use this page
import React, { useState } from "react";

const THEMES = [
  {
    id: "c",
    name: "Option C — Deep Purple",
    desc: "Premium / modern SaaS",
    bg: "#0F0A1E",
    surface: "#160F2E",
    accent: "#8B5CF6",
    accent2: "#EC4899",
    accentGrad: "linear-gradient(135deg,#8B5CF6,#EC4899)",
    text: "#F0EBFF",
    muted: "#8B7FAD",
    border: "rgba(139,92,246,0.18)",
    glow: "rgba(139,92,246,0.4)",
    safe: "#34D399",
    danger: "#FF4D6A",
    warning: "#FFB020",
    badge: "rgba(139,92,246,0.1)",
    badgeBorder: "rgba(139,92,246,0.3)",
    badgeText: "#8B5CF6",
  },
  {
    id: "a",
    name: "Option A — Midnight Threat",
    desc: "Serious cybersecurity tool",
    bg: "#080E1C",
    surface: "#0D1829",
    accent: "#00D4AA",
    accent2: "#00D4AA",
    accentGrad: "linear-gradient(135deg,#00D4AA,#00B896)",
    text: "#F0F4FF",
    muted: "#7B8FAD",
    border: "rgba(0,212,170,0.15)",
    glow: "rgba(0,212,170,0.4)",
    safe: "#00C980",
    danger: "#FF3B3B",
    warning: "#FFB020",
    badge: "rgba(0,212,170,0.1)",
    badgeBorder: "rgba(0,212,170,0.3)",
    badgeText: "#00D4AA",
  },
  {
    id: "b",
    name: "Option B — Terminal Dark",
    desc: "Hacker / CLI aesthetic",
    bg: "#0A0A0A",
    surface: "#111111",
    accent: "#39FF14",
    accent2: "#39FF14",
    accentGrad: "linear-gradient(135deg,#39FF14,#00CC00)",
    text: "#E8FFE8",
    muted: "#4D7A4D",
    border: "rgba(57,255,20,0.15)",
    glow: "rgba(57,255,20,0.35)",
    safe: "#39FF14",
    danger: "#FF3B3B",
    warning: "#FFD700",
    badge: "rgba(57,255,20,0.08)",
    badgeBorder: "rgba(57,255,20,0.3)",
    badgeText: "#39FF14",
  },
  {
    id: "d",
    name: "Option D — Slate & Gold",
    desc: "Authoritative / trustworthy",
    bg: "#0D1117",
    surface: "#161B22",
    accent: "#F5A623",
    accent2: "#F5A623",
    accentGrad: "linear-gradient(135deg,#F5A623,#E8960F)",
    text: "#E6EDF3",
    muted: "#7D8590",
    border: "rgba(245,166,35,0.15)",
    glow: "rgba(245,166,35,0.35)",
    safe: "#3FB950",
    danger: "#FF7B72",
    warning: "#F5A623",
    badge: "rgba(245,166,35,0.1)",
    badgeBorder: "rgba(245,166,35,0.3)",
    badgeText: "#F5A623",
  },
];

type Theme = typeof THEMES[0];

const MiniPreview: React.FC<{ theme: Theme; selected: boolean; onClick: () => void }> = ({
  theme, selected, onClick,
}) => (
  <div
    onClick={onClick}
    style={{
      cursor: "pointer",
      borderRadius: 18,
      border: selected
        ? `2px solid ${theme.accent}`
        : "2px solid rgba(255,255,255,0.08)",
      boxShadow: selected ? `0 0 28px ${theme.glow}` : "none",
      overflow: "hidden",
      transition: "all 0.2s ease",
      transform: selected ? "scale(1.02)" : "scale(1)",
    }}
  >
    {/* Mini UI inside the card */}
    <div style={{ background: theme.bg, padding: 0, fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Mini header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px",
        background: theme.bg,
        borderBottom: `1px solid ${theme.border}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div style={{
            width: 20, height: 20, borderRadius: 6,
            background: theme.accentGrad,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, fontWeight: 800, color: "#fff",
          }}>S</div>
          <span style={{ fontSize: 11, fontWeight: 800, color: theme.text, letterSpacing: "0.04em" }}>ScamScan</span>
        </div>
        <div style={{
          background: theme.accentGrad,
          borderRadius: 999, padding: "3px 10px",
          fontSize: 9, fontWeight: 700, color: "#fff",
        }}>Get Started</div>
      </div>

      {/* Mini hero */}
      <div style={{ padding: "18px 16px 14px", textAlign: "center" }}>
        <div style={{
          display: "inline-block",
          background: theme.badge,
          border: `1px solid ${theme.badgeBorder}`,
          borderRadius: 999, padding: "3px 10px",
          fontSize: 9, fontWeight: 600, color: theme.badgeText,
          marginBottom: 10,
        }}>
          ⚡ AI-Powered Scam Detection
        </div>
        <div style={{
          fontSize: 18, fontWeight: 900, lineHeight: 1.1,
          letterSpacing: "-0.02em", marginBottom: 8,
          background: theme.accentGrad,
          WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
        }}>
          Is that call safe?
        </div>
        <div style={{ fontSize: 9, color: theme.muted, lineHeight: 1.5 }}>
          AI-powered risk analysis backed by blockchain verification.
        </div>
      </div>

      {/* Mini scanner card */}
      <div style={{ padding: "0 12px 14px" }}>
        <div style={{
          background: `${theme.surface}cc`,
          border: `1px solid ${theme.border}`,
          borderRadius: 12, padding: "12px",
        }}>
          {/* Tabs */}
          <div style={{
            display: "flex", background: theme.bg,
            borderRadius: 999, padding: 3, marginBottom: 10,
            border: `1px solid ${theme.border}`,
          }}>
            <div style={{
              flex: 1, textAlign: "center", padding: "4px 0",
              borderRadius: 999, fontSize: 8, fontWeight: 700,
              background: theme.accentGrad, color: "#fff",
            }}>🎙️ Analyze Audio</div>
            <div style={{
              flex: 1, textAlign: "center", padding: "4px 0",
              fontSize: 8, fontWeight: 600, color: theme.muted,
            }}>📱 Check Number</div>
          </div>

          {/* Upload zone */}
          <div style={{
            border: `1.5px dashed ${theme.accent}44`,
            borderRadius: 8, padding: "10px",
            textAlign: "center", marginBottom: 8,
            background: `${theme.accent}08`,
          }}>
            <div style={{ fontSize: 14, marginBottom: 3 }}>🎙️</div>
            <div style={{ fontSize: 8, color: theme.text, fontWeight: 600, marginBottom: 2 }}>Drop recording here</div>
            <div style={{ fontSize: 7, color: theme.muted }}>MP3, WAV, M4A · 50MB</div>
          </div>

          {/* Input */}
          <div style={{
            background: theme.bg, border: `1px solid ${theme.border}`,
            borderRadius: 999, padding: "5px 10px",
            fontSize: 8, color: theme.muted, marginBottom: 8,
          }}>+1 555 123 4567</div>

          {/* Scan button */}
          <div style={{
            width: "100%", padding: "6px 0",
            borderRadius: 999, textAlign: "center",
            background: theme.accentGrad,
            fontSize: 8, fontWeight: 800, color: "#fff",
            letterSpacing: "0.08em",
            boxShadow: `0 0 12px ${theme.glow}`,
          }}>SCAN NOW</div>
        </div>
      </div>

      {/* Mini result card */}
      <div style={{ padding: "0 12px 14px" }}>
        <div style={{
          background: `${theme.surface}cc`,
          border: `1px solid rgba(255,77,106,0.3)`,
          borderRadius: 12, padding: "10px",
          boxShadow: `0 4px 20px rgba(255,77,106,0.1)`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{
              width: 24, height: 24, borderRadius: 6,
              background: "rgba(255,77,106,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 12,
            }}>⚠️</div>
            <div>
              <div style={{ fontSize: 7, color: theme.muted, fontWeight: 600, marginBottom: 2 }}>RISK ASSESSMENT</div>
              <div style={{ fontSize: 10, fontWeight: 800, color: theme.danger }}>Critical Threat</div>
            </div>
          </div>
          {/* Score bar */}
          <div style={{
            height: 4, borderRadius: 999,
            background: "rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: 6,
          }}>
            <div style={{ height: "100%", width: "90%", background: theme.danger, borderRadius: 999 }} />
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            <div style={{
              background: "rgba(255,77,106,0.15)", border: "1px solid rgba(255,77,106,0.3)",
              borderRadius: 999, padding: "2px 7px",
              fontSize: 7, fontWeight: 700, color: theme.danger,
            }}>Score: 90/100</div>
            <div style={{
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 999, padding: "2px 7px",
              fontSize: 7, color: theme.muted,
            }}>HIGH RISK</div>
          </div>
        </div>
      </div>
    </div>

    {/* Label bar */}
    <div style={{
      background: selected ? `${theme.accent}22` : "rgba(255,255,255,0.03)",
      borderTop: `1px solid ${selected ? theme.accent + "44" : "rgba(255,255,255,0.06)"}`,
      padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: selected ? theme.accent : theme.text, marginBottom: 2 }}>
          {theme.name}
        </div>
        <div style={{ fontSize: 11, color: theme.muted }}>{theme.desc}</div>
      </div>
      {selected && (
        <div style={{
          background: theme.accentGrad,
          borderRadius: 999, padding: "3px 10px",
          fontSize: 10, fontWeight: 700, color: "#fff",
        }}>✓ Selected</div>
      )}
    </div>
  </div>
);

const ThemePreview: React.FC<{ onSelect: (themeId: string) => void; current: string }> = ({
  onSelect, current,
}) => (
  <div style={{
    minHeight: "100vh",
    background: "#0A0A14",
    color: "#F0EBFF",
    fontFamily: "Inter, system-ui, sans-serif",
    padding: "48px 60px",
  }}>
    <div style={{ maxWidth: 1200, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{
          display: "inline-block",
          background: "rgba(139,92,246,0.1)",
          border: "1px solid rgba(139,92,246,0.3)",
          borderRadius: 999, padding: "5px 14px",
          fontSize: 11, fontWeight: 600, color: "#8B5CF6",
          marginBottom: 16,
        }}>
          Theme Picker
        </div>
        <h1 style={{ fontSize: "2rem", fontWeight: 900, letterSpacing: "-0.02em", margin: "0 0 10px", color: "#F0EBFF" }}>
          Choose your color scheme
        </h1>
        <p style={{ fontSize: 15, color: "#8B7FAD", margin: 0 }}>
          Click a theme to select it, then hit <strong style={{ color: "#F0EBFF" }}>Apply Theme</strong> to update the app.
        </p>
      </div>

      {/* Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
        gap: 24,
        marginBottom: 40,
      }}>
        {THEMES.map(theme => (
          <MiniPreview
            key={theme.id}
            theme={theme}
            selected={current === theme.id}
            onClick={() => onSelect(theme.id)}
          />
        ))}
      </div>

      {/* Apply button */}
      <div style={{ textAlign: "center" }}>
        <a
          href="/"
          style={{
            display: "inline-block",
            background: "linear-gradient(135deg,#8B5CF6,#EC4899)",
            borderRadius: 999, padding: "13px 40px",
            fontSize: 15, fontWeight: 700, color: "#fff",
            boxShadow: "0 0 28px rgba(139,92,246,0.4)",
            letterSpacing: "0.02em",
          }}
        >
          ← Back to App
        </a>
      </div>
    </div>
  </div>
);

export default ThemePreview;
