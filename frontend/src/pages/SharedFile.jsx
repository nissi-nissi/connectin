import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[power]}`;
};

const SharedFile = () => {
  const { token } = useParams();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const response = await api.get(`/files/shared/${token}`);
        setFile(response.data);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load shared file.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  const handleDownload = async () => {
    try {
      const response = await api.get(`/files/shared/${token}/download`);
      window.location.href = response.data.downloadUrl;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to prepare download.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-bold text-slate-900">Shared File</h1>
        {loading ? <p className="text-sm text-slate-500">Loading...</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        {!loading && !error && file ? (
          <div className="space-y-4">
            <div>
              <p className="text-lg font-semibold text-slate-900">{file.originalName || file.filename}</p>
              <p className="text-sm text-slate-600">
                {file.mimeType} | {formatBytes(file.fileSize)}
              </p>
            </div>

            {file.mimeType?.startsWith("image/") ? (
              <img src={file.previewUrl} alt={file.filename} className="max-h-[60vh] w-full rounded-lg object-contain" />
            ) : null}

            {file.mimeType?.startsWith("video/") ? (
              <video src={file.previewUrl} controls className="max-h-[60vh] w-full rounded-lg bg-black" />
            ) : null}

            {file.mimeType?.startsWith("audio/") ? (
              <audio src={file.previewUrl} controls className="w-full" />
            ) : null}

            {!file.mimeType?.startsWith("image/") &&
            !file.mimeType?.startsWith("video/") &&
            !file.mimeType?.startsWith("audio/") ? (
              <a
                href={file.previewUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-lg bg-slate-100 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200"
              >
                Open Preview
              </a>
            ) : null}

            <button
              type="button"
              onClick={handleDownload}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700"
            >
              Download
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default SharedFile;
