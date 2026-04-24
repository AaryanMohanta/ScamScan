import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import FileUpload from "../components/FileUpload";

function makeFile(name: string, type = "audio/wav"): File {
  return new File([new Uint8Array(100)], name, { type });
}

describe("FileUpload", () => {
  // ---------------------------------------------------------------------------
  // Initial render
  // ---------------------------------------------------------------------------

  it("shows the microphone emoji and prompt text initially", () => {
    render(<FileUpload onFileSelected={vi.fn()} />);
    expect(screen.getByText("🎙️")).toBeInTheDocument();
    expect(screen.getByText("Drop your call recording here")).toBeInTheDocument();
    expect(screen.getByText(/MP3, WAV, M4A, OGG/)).toBeInTheDocument();
  });

  it("renders a hidden file input accepting audio/*", () => {
    render(<FileUpload onFileSelected={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.accept).toBe("audio/*");
    expect(input.style.display).toBe("none");
  });

  // ---------------------------------------------------------------------------
  // File selection via input
  // ---------------------------------------------------------------------------

  it("calls onFileSelected when a file is chosen via input", async () => {
    const handler = vi.fn();
    render(<FileUpload onFileSelected={handler} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = makeFile("recording.wav");
    await userEvent.upload(input, file);

    expect(handler).toHaveBeenCalledOnce();
    expect(handler).toHaveBeenCalledWith(file);
  });

  it("shows the file name after selection", async () => {
    render(<FileUpload onFileSelected={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, makeFile("my_call.mp3"));

    expect(screen.getByText("my_call.mp3")).toBeInTheDocument();
  });

  it("shows music note emoji after file is selected", async () => {
    render(<FileUpload onFileSelected={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, makeFile("test.wav"));

    expect(screen.getByText("🎵")).toBeInTheDocument();
  });

  it("shows 'Click to change file' hint after file is selected", async () => {
    render(<FileUpload onFileSelected={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await userEvent.upload(input, makeFile("call.m4a"));

    expect(screen.getByText("Click to change file")).toBeInTheDocument();
  });

  // ---------------------------------------------------------------------------
  // Drag and drop
  // ---------------------------------------------------------------------------

  it("calls onFileSelected when a file is dropped", () => {
    const handler = vi.fn();
    render(<FileUpload onFileSelected={handler} />);

    const dropZone = screen.getByText("Drop your call recording here").closest("div")!.parentElement!;
    const file = makeFile("dropped.wav");

    fireEvent.drop(dropZone, {
      dataTransfer: { files: [file] },
    });

    expect(handler).toHaveBeenCalledWith(file);
  });

  it("does not throw when dropping without files", () => {
    const handler = vi.fn();
    render(<FileUpload onFileSelected={handler} />);

    const dropZone = screen.getByText("Drop your call recording here").closest("div")!.parentElement!;

    expect(() =>
      fireEvent.drop(dropZone, { dataTransfer: { files: [] } })
    ).not.toThrow();

    expect(handler).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Click-to-open
  // ---------------------------------------------------------------------------

  it("triggers input click when the drop zone is clicked", async () => {
    render(<FileUpload onFileSelected={vi.fn()} />);

    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = vi.spyOn(input, "click");

    const dropZone = screen.getByText("Drop your call recording here").closest("div")!.parentElement!;
    await userEvent.click(dropZone);

    expect(clickSpy).toHaveBeenCalled();
  });
});
