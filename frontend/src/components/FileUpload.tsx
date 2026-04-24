// src/components/FileUpload.tsx
import React, { useRef, useState } from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const handle = (file: File) => {
    setFileName(file.name);
    onFileSelected(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handle(file);
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      style={{
        border: `1.5px dashed ${dragging ? "var(--accent)" : "rgba(139,92,246,0.3)"}`,
        borderRadius: 16,
        padding: "32px 24px",
        textAlign: "center",
        cursor: "pointer",
        background: dragging
          ? "rgba(139,92,246,0.1)"
          : "rgba(139,92,246,0.05)",
        transition: "all 0.2s ease",
        userSelect: "none",
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        style={{ display: "none" }}
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }}
      />
      <div style={{ fontSize: 30, marginBottom: 10 }}>
        {fileName ? "🎵" : "🎙️"}
      </div>
      <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)", marginBottom: 5 }}>
        {fileName ?? "Drop your call recording here"}
      </div>
      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
        {fileName ? "Click to change file" : "MP3, WAV, M4A, OGG · Max 50MB"}
      </div>
    </div>
  );
};

export default FileUpload;
