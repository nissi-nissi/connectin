import { useRef, useState } from "react";
import api from "../services/api";

const FileUpload = ({ currentFolderId, onUploaded }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [error, setError] = useState("");

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        if (currentFolderId) {
          formData.append("folderId", currentFolderId);
        }

        setCurrentFileName(file.name);
        setProgress(0);

        await api.post("/files/upload", formData, {
          onUploadProgress: (event) => {
            if (!event.total) return;
            setProgress(Math.round((event.loaded / event.total) * 100));
          }
        });
      }

      setCurrentFileName("");
      setProgress(100);
      onUploaded();
    } catch (err) {
      setError(err.response?.data?.message || "Upload failed.");
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
      }, 200);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    uploadFiles([...event.dataTransfer.files]);
  };

  const onInputChange = (event) => {
    uploadFiles([...event.target.files]);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setDragging(false);
        }}
        onDrop={onDrop}
        className={`rounded-xl border-2 border-dashed p-6 text-center transition ${
          dragging ? "border-brand-600 bg-brand-50" : "border-slate-300 bg-white"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16v-4m0 0l-3 3m3-3l3 3m4-3v4m0 0l3-3m-3 3l-3-3M3 12h18" />
          </svg>
          <p className="text-sm text-slate-600">
            Drag & drop files here, or
            <button
              type="button"
              className="font-semibold text-brand-700 hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              browse
            </button>
          </p>
        </div>
        <p className="mt-1 text-xs text-slate-500">Max size: 100 MB per file</p>
        <input ref={inputRef} type="file" multiple className="hidden" onChange={onInputChange} />
      </div>

      {uploading ? (
        <div className="rounded-lg bg-white p-3 shadow-sm">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate">{currentFileName || "Uploading..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div
              className="h-2 rounded-full bg-brand-600 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default FileUpload;
