// src/components/FileUpload.tsx
import React from "react";

interface FileUploadProps {
  onFileSelected: (file: File) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelected }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelected(file);
    }
  };

  return (
    <div>
      <label>
        Select call audio file:
        <input type="file" accept="audio/*" onChange={handleChange} />
      </label>
    </div>
  );
};

export default FileUpload;