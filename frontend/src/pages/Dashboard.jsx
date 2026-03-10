import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import { useAuth } from "../hooks/useAuth";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import FolderList from "../components/FolderList";
import FilePreview from "../components/FilePreview";

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[power]}`;
};

const STORAGE_LIMIT_BYTES = 5 * 1024 * 1024 * 1024;

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [allFolders, setAllFolders] = useState([]);
  const [currentFolderId, setCurrentFolderId] = useState(null);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: "My Drive" }]);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState("list");
  const [usageBytes, setUsageBytes] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stats, setStats] = useState({ totalFiles: 0, totalFolders: 0, topShared: [] });
  const [previewFile, setPreviewFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reloadData = () => setRefreshKey((prev) => prev + 1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError("");
      try {
        const folderParam = currentFolderId || "root";
        const [foldersRes, allFoldersRes, filesRes, statsRes] = await Promise.all([
          api.get("/folders/list", { params: { parentFolderId: folderParam } }),
          api.get("/folders/list", { params: { all: true } }),
          api.get("/files/list", { params: { folderId: folderParam, search } }),
          api.get("/files/stats")
        ]);

        setFolders(foldersRes.data);
        setAllFolders(allFoldersRes.data);
        setFiles(filesRes.data);
        setStats(statsRes.data);
        setUsageBytes(statsRes.data.usageBytes || 0);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentFolderId, search, refreshKey]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleCreateFolder = async (name) => {
    try {
      await api.post("/folders/create", {
        name,
        parentFolderId: currentFolderId || "root"
      });
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create folder.");
    }
  };

  const handleRenameFolder = async (id, name) => {
    try {
      await api.patch(`/folders/rename/${id}`, { name });
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rename folder.");
    }
  };

  const handleOpenFolder = (folder) => {
    setCurrentFolderId(folder._id);
    setBreadcrumbs((prev) => [...prev, { id: folder._id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (index) => {
    const selected = breadcrumbs[index];
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setCurrentFolderId(selected?.id || null);
  };

  const handleDeleteFolder = async (folderId) => {
    if (!window.confirm("Delete this folder? It must be empty.")) return;
    try {
      await api.delete(`/folders/delete/${folderId}`);
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete folder.");
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await api.delete(`/files/delete/${fileId}`);
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to delete file.");
    }
  };

  const handleRenameFile = async (fileId, filename) => {
    try {
      await api.patch(`/files/rename/${fileId}`, { filename });
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to rename file.");
    }
  };

  const handleMoveFile = async (fileId, folderId) => {
    try {
      await api.post(`/files/move/${fileId}`, { folderId: folderId || "root" });
      reloadData();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to move file.");
    }
  };

  const handleShareFile = async (fileId) => {
    try {
      const expirationInput = window.prompt(
        "Expiration in hours (leave blank for no expiration):",
        "24"
      );

      const payload = {};
      if (expirationInput && Number(expirationInput) > 0) {
        payload.expiresInHours = Number(expirationInput);
      }

      const response = await api.post(`/files/share/${fileId}`, payload);
      window.navigator.clipboard?.writeText(response.data.shareUrl);
      return response.data.shareUrl;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create share link.");
      return null;
    }
  };

  const handleDownloadFile = async (fileId) => {
    try {
      const response = await api.get(`/files/download/${fileId}`);
      window.location.href = response.data.downloadUrl;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to prepare download.");
    }
  };

  const handlePreviewFile = async (fileId) => {
    try {
      const response = await api.get(`/files/preview/${fileId}`);
      setPreviewFile(response.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load preview.");
    }
  };

  const usagePercent = Math.min(Math.round((usageBytes / STORAGE_LIMIT_BYTES) * 100), 100);

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Cloud Drive Dashboard</h1>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-slate-100 px-3 py-2 text-sm hover:bg-slate-200"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-[300px_1fr] sm:px-6">
        {/* quick tips */}
        <div className="sm:col-span-2">
          <div className="rounded-xl bg-brand-50 p-4 text-sm text-brand-800">
            📌 Drag files into the upload area or click “Browse”. Use the toolbar in the file list to preview, rename, move or share.
          </div>
        </div>
        <aside className="space-y-4">
          <div className="grid gap-4">
            <div className="rounded-xl bg-white p-4 shadow-sm space-y-2">
              <p className="mb-2 text-sm font-semibold text-slate-900">Storage Usage</p>
              <div className="mb-2 h-2 rounded-full bg-slate-200">
                <div
                  className="h-2 rounded-full bg-brand-600 transition-all"
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
              <p className="text-xs text-slate-600">
                {formatBytes(usageBytes)} of {formatBytes(STORAGE_LIMIT_BYTES)}
              </p>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v16h16V4H4zm4 4h8v8H8V8z" />
              </svg>
              <div>
                <p className="text-xs text-slate-500">Files</p>
                <p className="text-lg font-semibold text-slate-900">{stats.totalFiles}</p>
              </div>
            </div>
            <div className="rounded-xl bg-white p-4 shadow-sm flex items-center gap-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-brand-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h18M5 7v12a2 2 0 002 2h10a2 2 0 002-2V7" />
              </svg>
              <div>
                <p className="text-xs text-slate-500">Folders</p>
                <p className="text-lg font-semibold text-slate-900">{stats.totalFolders}</p>
              </div>
            </div>
          </div>

          <FolderList
            folders={folders}
            breadcrumbs={breadcrumbs}
            onOpenFolder={handleOpenFolder}
            onBreadcrumbClick={handleBreadcrumbClick}
            onCreateFolder={handleCreateFolder}
            onDeleteFolder={handleDeleteFolder}
            onRenameFolder={handleRenameFolder}
          />
        </aside>

        <section className="space-y-4">
          <div className="rounded-xl bg-white p-4 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files by name..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
          </div>

          <FileUpload currentFolderId={currentFolderId} onUploaded={reloadData} />

          {stats.topShared && stats.topShared.length > 0 && (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Top Shared Files</h2>
              <ul className="space-y-1 text-xs text-slate-700">
                {stats.topShared.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <button
                      type="button"
                      className="truncate text-left hover:underline"
                      onClick={() => handlePreviewFile(item._id)}
                    >
                      {item.filename}
                    </button>
                    <span className="ml-2 font-medium text-brand-600">
                      {item.count}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="rounded-xl bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Loading files...</p>
            </div>
          ) : (
            <FileList
              files={files}
              allFolders={allFolders}
              viewMode={viewMode}
              setViewMode={setViewMode}
              onDelete={handleDeleteFile}
              onRename={handleRenameFile}
              onMove={handleMoveFile}
              onShare={handleShareFile}
              onDownload={handleDownloadFile}
              onPreview={handlePreviewFile}
            />
          )}
        </section>
      </main>

      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default Dashboard;
