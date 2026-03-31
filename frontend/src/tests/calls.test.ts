import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uploadAudio, analyseCall } from "../api/calls";

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function mockOk(body: unknown, status = 200) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

function mockFail(status: number, body: unknown = { detail: "error" }) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
    statusText: "Error",
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.restoreAllMocks());

// ---------------------------------------------------------------------------
// uploadAudio()
// ---------------------------------------------------------------------------

describe("uploadAudio", () => {
  it("sends a POST to /api/calls/upload with FormData", async () => {
    mockOk({ call_id: "test-id-123" });

    const file = new File([new Uint8Array(10)], "test.wav", { type: "audio/wav" });
    const result = await uploadAudio(file);

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/calls/upload");
    expect(opts.method).toBe("POST");
    expect(opts.body).toBeInstanceOf(FormData);
    expect(result).toBe("test-id-123");
  });

  it("returns the call_id from the response", async () => {
    mockOk({ call_id: "abc-xyz-999" });
    const file = new File([], "x.mp3", { type: "audio/mpeg" });
    const id = await uploadAudio(file);
    expect(id).toBe("abc-xyz-999");
  });

  it("throws on 400 response", async () => {
    mockFail(400);
    const file = new File([], "bad.txt", { type: "text/plain" });
    await expect(uploadAudio(file)).rejects.toThrow(/400/);
  });

  it("throws on 413 response (file too large)", async () => {
    mockFail(413);
    const file = new File([], "huge.wav", { type: "audio/wav" });
    await expect(uploadAudio(file)).rejects.toThrow(/413/);
  });

  it("throws on 500 server error", async () => {
    mockFail(500, { detail: "Internal Server Error" });
    const file = new File([], "test.wav", { type: "audio/wav" });
    await expect(uploadAudio(file)).rejects.toThrow(/500/);
  });
});

// ---------------------------------------------------------------------------
// analyseCall()
// ---------------------------------------------------------------------------

describe("analyseCall", () => {
  const mockResult = {
    transcript: "Send me gift cards.",
    risk_level: "HIGH",
    scam_score: 0.9,
    advice: "Do not engage.",
  };

  it("sends a POST to /api/calls/{callId}/analyse", async () => {
    mockOk(mockResult);

    await analyseCall("my-call-id");

    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe("/api/calls/my-call-id/analyse");
    expect(opts.method).toBe("POST");
    expect(opts.headers["Content-Type"]).toBe("application/json");
  });

  it("sends phone_number in the body when provided", async () => {
    mockOk(mockResult);

    await analyseCall("my-call-id", { phoneNumber: "+15551234567" });

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBe("+15551234567");
  });

  it("sends null phone_number when omitted", async () => {
    mockOk(mockResult);

    await analyseCall("my-call-id");

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.phone_number).toBeNull();
  });

  it("returns the parsed AnalyseResult", async () => {
    mockOk(mockResult);

    const result = await analyseCall("my-call-id", { phoneNumber: "+15551234567" });

    expect(result.risk_level).toBe("HIGH");
    expect(result.scam_score).toBe(0.9);
    expect(result.transcript).toBe("Send me gift cards.");
    expect(result.advice).toBe("Do not engage.");
  });

  it("throws on 404 (audio not found)", async () => {
    mockFail(404, { detail: "No audio found" });
    await expect(analyseCall("missing-id")).rejects.toThrow(/404/);
  });

  it("throws on 500 with detail message", async () => {
    mockFail(500, { detail: "Transcription failed" });
    await expect(analyseCall("bad-id")).rejects.toThrow(/500/);
  });
});
