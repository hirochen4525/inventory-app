"use client";

import { useCallback, useState, DragEvent } from "react";

type Props = {
  accept: string;
  multiple?: boolean;
  label: string;
  onFiles: (files: File[]) => void;
};

export default function FileDropzone({
  accept,
  multiple = false,
  label,
  onFiles,
}: Props) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length) onFiles(files);
    },
    [onFiles]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length) onFiles(files);
      e.target.value = "";
    },
    [onFiles]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
        dragging
          ? "border-blue-500 bg-blue-50"
          : "border-gray-300 hover:border-gray-400"
      }`}
      onClick={() => document.getElementById(`dropzone-${label}`)?.click()}
    >
      <input
        id={`dropzone-${label}`}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleChange}
        className="hidden"
      />
      <p className="text-gray-500">{label}</p>
      <p className="text-sm text-gray-400 mt-1">
        ドラッグ&ドロップ または クリックして選択
      </p>
    </div>
  );
}
