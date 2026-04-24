import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import AnalysisResult from "../components/AnalysisResult";
import type { AnalyseResult } from "../api/calls";

const lowResult: AnalyseResult = {
  risk_level: "LOW",
  scam_score: 0.15,
  transcript: "Hello, this is your bank calling about your account.",
  advice: "No threats detected. This call appears legitimate.",
};

const mediumResult: AnalyseResult = {
  risk_level: "MEDIUM",
  scam_score: 0.55,
  transcript: "We noticed unusual activity on your account.",
  advice: "Proceed with caution. Verify the caller's identity.",
};

const highResult: AnalyseResult = {
  risk_level: "HIGH",
  scam_score: 0.9,
  transcript: "Send gift cards to claim your prize immediately.",
  advice: "Do not engage. This is a high-confidence scam.",
};

describe("AnalysisResult", () => {
  // ---------------------------------------------------------------------------
  // Risk label rendering
  // ---------------------------------------------------------------------------

  it("shows 'Safe / Verified' for LOW risk", () => {
    render(<AnalysisResult result={lowResult} />);
    expect(screen.getByText("Safe / Verified")).toBeInTheDocument();
  });

  it("shows 'Potentially Suspicious' for MEDIUM risk", () => {
    render(<AnalysisResult result={mediumResult} />);
    expect(screen.getByText("Potentially Suspicious")).toBeInTheDocument();
  });

  it("shows 'Critical Threat' for HIGH risk", () => {
    render(<AnalysisResult result={highResult} />);
    expect(screen.getByText("Critical Threat")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Score display
  // ---------------------------------------------------------------------------

  it("displays the scam probability as a percentage", () => {
    render(<AnalysisResult result={highResult} />);
    // 0.90 → 90%
    expect(screen.getAllByText(/90%/).length).toBeGreaterThan(0);
  });

  it("rounds fractional scores correctly", () => {
    const result = { ...lowResult, scam_score: 0.154 };
    render(<AnalysisResult result={result} />);
    expect(screen.getAllByText(/15%/).length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Advice
  // ---------------------------------------------------------------------------

  it("renders the advice text", () => {
    render(<AnalysisResult result={highResult} />);
    expect(screen.getByText(highResult.advice)).toBeInTheDocument();
  });

  it("renders advice for medium risk", () => {
    render(<AnalysisResult result={mediumResult} />);
    expect(screen.getByText(mediumResult.advice)).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Transcript
  // ---------------------------------------------------------------------------

  it("shows transcript section when transcript is present", () => {
    render(<AnalysisResult result={highResult} />);
    expect(screen.getByText("Call Transcript")).toBeInTheDocument();
    expect(screen.getByText(highResult.transcript)).toBeInTheDocument();
  });

  it("hides transcript section when transcript is empty", () => {
    render(<AnalysisResult result={{ ...lowResult, transcript: "" }} />);
    expect(screen.queryByText("Call Transcript")).not.toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Verdict pills
  // ---------------------------------------------------------------------------

  it("shows score pill with correct value", () => {
    render(<AnalysisResult result={lowResult} />);
    expect(screen.getByText("Score: 15/100")).toBeInTheDocument();
  });

  it("shows verdict pill with risk level", () => {
    render(<AnalysisResult result={highResult} />);
    expect(screen.getByText("Verdict: HIGH")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Edge cases
  // ---------------------------------------------------------------------------

  it("handles undefined scam_score gracefully", () => {
    const result = { ...lowResult, scam_score: undefined as unknown as number };
    expect(() => render(<AnalysisResult result={result} />)).not.toThrow();
    expect(screen.getAllByText(/0%/).length).toBeGreaterThan(0);
  });

  it("defaults to LOW config for unknown risk_level", () => {
    const result = { ...lowResult, risk_level: "UNKNOWN" as AnalyseResult["risk_level"] };
    render(<AnalysisResult result={result} />);
    expect(screen.getByText("Safe / Verified")).toBeInTheDocument();
  });
});
