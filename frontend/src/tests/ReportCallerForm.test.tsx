import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportCallerForm from "../components/ReportCallerForm";

// Mock the reportCaller API
vi.mock("../api/finalcalls", () => ({
  reportCaller: vi.fn(),
}));

import { reportCaller } from "../api/finalcalls";
const mockReportCaller = vi.mocked(reportCaller);

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReportCallerForm", () => {
  // ---------------------------------------------------------------------------
  // Visibility
  // ---------------------------------------------------------------------------

  it("renders nothing when riskLevel is not HIGH", () => {
    const { container } = render(<ReportCallerForm callId="abc" riskLevel="LOW" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders nothing for MEDIUM risk", () => {
    const { container } = render(<ReportCallerForm callId="abc" riskLevel="MEDIUM" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders the form for HIGH risk", () => {
    render(<ReportCallerForm callId="abc" riskLevel="HIGH" />);
    expect(screen.getByText("🚨 Report this caller")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone number or identifier")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Report to Blockchain" })).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Form interaction
  // ---------------------------------------------------------------------------

  it("submit button is disabled when input is empty", () => {
    render(<ReportCallerForm callId="abc" riskLevel="HIGH" />);
    expect(screen.getByRole("button", { name: "Report to Blockchain" })).toBeDisabled();
  });

  it("submit button enables when phone number is typed", async () => {
    render(<ReportCallerForm callId="abc" riskLevel="HIGH" />);

    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15551234567");

    expect(screen.getByRole("button", { name: "Report to Blockchain" })).not.toBeDisabled();
  });

  // ---------------------------------------------------------------------------
  // Successful submission
  // ---------------------------------------------------------------------------

  it("shows tx hash on successful report", async () => {
    mockReportCaller.mockResolvedValue("0xdeadbeef1234");

    render(<ReportCallerForm callId="call-1" riskLevel="HIGH" />);
    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15551234567");
    await userEvent.click(screen.getByRole("button", { name: "Report to Blockchain" }));

    await waitFor(() => {
      expect(screen.getByText("✓ Reported to blockchain")).toBeInTheDocument();
      expect(screen.getByText(/0xdeadbeef1234/)).toBeInTheDocument();
    });
  });

  it("calls reportCaller with correct arguments", async () => {
    mockReportCaller.mockResolvedValue("0xabc123");

    render(<ReportCallerForm callId="my-call-id" riskLevel="HIGH" />);
    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15559876543");
    await userEvent.click(screen.getByRole("button", { name: "Report to Blockchain" }));

    await waitFor(() => {
      expect(mockReportCaller).toHaveBeenCalledWith("my-call-id", "+15559876543");
    });
  });

  // ---------------------------------------------------------------------------
  // Error handling
  // ---------------------------------------------------------------------------

  it("shows error message when reportCaller throws", async () => {
    mockReportCaller.mockRejectedValue(new Error("Network error"));

    render(<ReportCallerForm callId="call-1" riskLevel="HIGH" />);
    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15551234567");
    await userEvent.click(screen.getByRole("button", { name: "Report to Blockchain" }));

    await waitFor(() => {
      expect(screen.getByText("Failed to submit report. Please try again.")).toBeInTheDocument();
    });
  });

  it("re-enables the submit button after an error", async () => {
    mockReportCaller.mockRejectedValue(new Error("Network error"));

    render(<ReportCallerForm callId="call-1" riskLevel="HIGH" />);
    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15551234567");
    await userEvent.click(screen.getByRole("button", { name: "Report to Blockchain" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Report to Blockchain" })).not.toBeDisabled();
    });
  });

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  it("shows 'Submitting…' while the request is in flight", async () => {
    let resolve: (v: string) => void;
    mockReportCaller.mockReturnValue(new Promise((r) => { resolve = r; }));

    render(<ReportCallerForm callId="call-1" riskLevel="HIGH" />);
    await userEvent.type(screen.getByPlaceholderText("Phone number or identifier"), "+15551234567");

    // Click without awaiting the full completion so we can inspect mid-flight state
    const clickPromise = userEvent.click(screen.getByRole("button", { name: "Report to Blockchain" }));
    await vi.waitFor(() => {
      expect(screen.getByRole("button", { name: "Submitting…" })).toBeDisabled();
    });

    // Resolve the pending promise to avoid act() warning
    await act(async () => {
      resolve!("0xhash");
    });
    await clickPromise;
  });
});
