import { useEffect, useRef, useState } from "react";
import { ArrowUpTrayIcon, CloudArrowUpIcon } from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import api from "../services/api";

const FileUpload = ({ currentFolderId, onUploaded, onError, browseSignal }) => {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentFileName, setCurrentFileName] = useState("");
  const [batchCount, setBatchCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    if (browseSignal) {
      inputRef.current?.click();
    }
  }, [browseSignal]);

  const uploadFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    setError("");
    setBatchCount(files.length);

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
      const message = err.response?.data?.message || "Upload failed.";
      setError(message);
      onError?.(message);
    } finally {
      setTimeout(() => {
        setUploading(false);
        setProgress(0);
        setBatchCount(0);
      }, 220);
    }
  };

  const onDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    uploadFiles([...event.dataTransfer.files]);
  };

  return (
    <div className="space-y-3">
      <motion.div
        whileHover={{ scale: 1.005 }}
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
        className={`rounded-2xl border-2 border-dashed p-7 text-center transition-all duration-300 ${
          dragging
            ? "border-brand-600 bg-gradient-to-r from-brand-50 to-sky-50 shadow-sm"
            : "border-slate-300 bg-white"
        }`}
      >
        <div className="flex flex-col items-center justify-center gap-2">
          <CloudArrowUpIcon className="h-10 w-10 text-brand-600" />
          <p className="text-sm text-slate-600">
            Drop files here or{" "}
            <button
              type="button"
              className="font-semibold text-brand-700 hover:underline"
              onClick={() => inputRef.current?.click()}
            >
              choose from device
            </button>
          </p>
          <p className="text-xs text-slate-500">Batch upload enabled • Max size: 100 MB per file</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => uploadFiles([...e.target.files])}
        />
      </motion.div>

      {uploading ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm"
        >
          <div className="mb-2 flex items-center justify-between text-xs text-slate-600">
            <span className="truncate">{currentFileName || "Uploading..."}</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-200">
            <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>{batchCount > 1 ? `${batchCount} files in queue` : "Single file upload"}</span>
            <ArrowUpTrayIcon className="h-4 w-4" />
          </div>
        </motion.div>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
};

export default FileUpload;
