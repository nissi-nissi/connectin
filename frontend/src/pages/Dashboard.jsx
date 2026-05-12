import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  Bars3Icon,
  ChartPieIcon,
  ChevronDownIcon,
  FolderPlusIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ShareIcon,
  TrashIcon,
  UserCircleIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";
import { Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "react-toastify";
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

const sidebarItems = [
  { key: "drive", label: "My Drive", icon: FolderIcon },
  { key: "recent", label: "Recent", icon: ChartPieIcon },
  { key: "shared", label: "Shared", icon: ShareIcon },
  { key: "trash", label: "Trash", icon: TrashIcon }
];

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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("drive");
  const [browseSignal, setBrowseSignal] = useState(0);
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

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
      toast.success("Folder created");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create folder.";
      setError(message);
      toast.error(message);
    }
  };

  const handleRenameFolder = async (id, name) => {
    try {
      await api.patch(`/folders/rename/${id}`, { name });
      toast.success("Folder renamed");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to rename folder.";
      setError(message);
      toast.error(message);
    }
  };

  const handleOpenFolder = (folder) => {
    setCurrentFolderId(folder._id);
    setActiveNav("drive");
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
      toast.success("Folder deleted");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete folder.";
      setError(message);
      toast.error(message);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Delete this file?")) return;
    try {
      await api.delete(`/files/delete/${fileId}`);
      toast.success("File deleted");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to delete file.";
      setError(message);
      toast.error(message);
    }
  };

  const handleRenameFile = async (fileId, filename) => {
    try {
      await api.patch(`/files/rename/${fileId}`, { filename });
      toast.success("File renamed");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to rename file.";
      setError(message);
      toast.error(message);
    }
  };

  const handleMoveFile = async (fileId, folderId) => {
    try {
      await api.post(`/files/move/${fileId}`, { folderId: folderId || "root" });
      toast.success("File moved");
      reloadData();
    } catch (err) {
      const message = err.response?.data?.message || "Failed to move file.";
      setError(message);
      toast.error(message);
    }
  };

  const handleShareFile = async (fileId, expiresInHours) => {
    try {
      const payload = {};
      if (expiresInHours && Number(expiresInHours) > 0) {
        payload.expiresInHours = Number(expiresInHours);
      }

      const response = await api.post(`/files/share/${fileId}`, payload);
      window.navigator.clipboard?.writeText(response.data.shareUrl);
      toast.success("Share link copied");
      return response.data.shareUrl;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to create share link.";
      setError(message);
      toast.error(message);
      return null;
    }
  };

  const handleDownloadFile = async (fileId) => {
    try {
      const response = await api.get(`/files/download/${fileId}`);
      window.location.href = response.data.downloadUrl;
    } catch (err) {
      const message = err.response?.data?.message || "Failed to prepare download.";
      setError(message);
      toast.error(message);
    }
  };

  const handlePreviewFile = async (fileId) => {
    try {
      const response = await api.get(`/files/preview/${fileId}`);
      setPreviewFile(response.data);
    } catch (err) {
      const message = err.response?.data?.message || "Failed to load preview.";
      setError(message);
      toast.error(message);
    }
  };

  const usagePercent = Math.min(Math.round((usageBytes / STORAGE_LIMIT_BYTES) * 100), 100);
  const storageChartData = useMemo(
    () => [
      { name: "Used", value: usageBytes || 0, fill: "#2563eb" },
      { name: "Available", value: Math.max(STORAGE_LIMIT_BYTES - usageBytes, 0), fill: "#cbd5e1" }
    ],
    [usageBytes]
  );

  const statsCards = [
    { label: "Total Files", value: stats.totalFiles ?? 0 },
    { label: "Folders", value: stats.totalFolders ?? 0 },
    { label: "Storage Used", value: formatBytes(usageBytes) },
    { label: "Shared Items", value: stats.topShared?.length ?? 0 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-3 sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            aria-label="Toggle sidebar"
          >
            <Bars3Icon className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 font-semibold">
            <ChartPieIcon className="h-6 w-6 text-brand-600" />
            <span>CONNECTIN Drive</span>
          </div>

          <div className="mx-2 hidden flex-1 items-center rounded-xl border border-slate-200 bg-slate-50 px-3 sm:flex">
            <MagnifyingGlassIcon className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search files or folders"
              className="w-full bg-transparent px-2 py-2 text-sm outline-none"
            />
          </div>

          <div className="relative ml-auto">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-1.5 hover:bg-slate-100"
              onClick={() => setProfileOpen((prev) => !prev)}
            >
              <UserCircleIcon className="h-6 w-6 text-brand-600" />
              <span className="hidden text-sm sm:block">{user?.email || "User"}</span>
              <ChevronDownIcon className="h-4 w-4 text-slate-500" />
            </button>
            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border border-slate-200 bg-white p-1 shadow-lg">
                <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-100" onClick={() => toast.info("Settings coming soon")}>Settings</button>
                <button type="button" className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50" onClick={handleLogout}>Logout</button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-[1400px] gap-4 px-4 py-5 sm:grid-cols-[260px_1fr] sm:px-6">
        <aside className={`space-y-4 ${sidebarCollapsed ? "hidden sm:block sm:w-16" : ""}`}>
          <div className="rounded-2xl border border-slate-200 bg-white p-3">
            <nav className="space-y-1">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.key}
                    type="button"
                    className={`flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${
                      activeNav === item.key ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"
                    }`}
                    onClick={() => setActiveNav(item.key)}
                  >
                    <Icon className="h-4 w-4" />
                    {!sidebarCollapsed ? item.label : null}
                  </button>
                );
              })}
            </nav>
          </div>

          {!sidebarCollapsed ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <p className="text-sm font-semibold">Storage</p>
              <div className="mt-2 h-2 rounded-full bg-slate-200">
                <div className="h-2 rounded-full bg-brand-600 transition-all" style={{ width: `${usagePercent}%` }} />
              </div>
              <p className="mt-2 text-xs text-slate-500">{formatBytes(usageBytes)} of {formatBytes(STORAGE_LIMIT_BYTES)}</p>
              <div className="mt-3 h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={storageChartData} dataKey="value" innerRadius={25} outerRadius={40} paddingAngle={2} />
                    <Tooltip formatter={(value) => formatBytes(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}

          {!sidebarCollapsed ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="mb-2 text-sm font-semibold">Quick Actions</p>
              <div className="space-y-2">
                <button type="button" className="flex w-full items-center gap-2 rounded-xl bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700" onClick={() => setCreateFolderOpen(true)}>
                  <FolderPlusIcon className="h-4 w-4" />
                  New Folder
                </button>
                <button type="button" className="flex w-full items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm hover:bg-slate-100" onClick={() => setBrowseSignal((prev) => prev + 1)}>
                  <ArrowUpTrayIcon className="h-4 w-4" />
                  Upload File
                </button>
              </div>
            </div>
          ) : null}

          {!sidebarCollapsed ? (
            <FolderList
              folders={folders}
              breadcrumbs={breadcrumbs}
              onOpenFolder={handleOpenFolder}
              onBreadcrumbClick={handleBreadcrumbClick}
              onDeleteFolder={handleDeleteFolder}
              onRenameFolder={handleRenameFolder}
            />
          ) : null}
        </aside>

        <section className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-1 text-xs text-slate-500">
              {breadcrumbs.map((crumb, index) => (
                <button key={`${crumb.id || "root"}-top`} type="button" className="rounded-full px-2 py-1 hover:bg-slate-100" onClick={() => handleBreadcrumbClick(index)}>
                  {crumb.name}
                </button>
              ))}
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {statsCards.map((card) => (
                <motion.div key={card.label} whileHover={{ y: -2 }} className="rounded-xl border border-slate-200 p-3">
                  <p className="text-xs text-slate-500">{card.label}</p>
                  <p className="mt-1 text-lg font-semibold">{card.value}</p>
                </motion.div>
              ))}
            </div>
          </div>

          <FileUpload
            currentFolderId={currentFolderId}
            onUploaded={() => {
              toast.success("Upload complete");
              reloadData();
            }}
            onError={(message) => toast.error(message)}
            browseSignal={browseSignal}
          />

          {stats.topShared && stats.topShared.length > 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4">
              <h2 className="mb-2 text-sm font-semibold text-slate-900">Top Shared Files</h2>
              <ul className="space-y-1 text-xs text-slate-700">
                {stats.topShared.map((item) => (
                  <li key={item._id} className="flex justify-between">
                    <button type="button" className="truncate text-left hover:underline" onClick={() => handlePreviewFile(item._id)}>
                      {item.filename}
                    </button>
                    <span className="ml-2 font-medium text-brand-600">{item.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">{error}</div> : null}

          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
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

      {createFolderOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={() => setCreateFolderOpen(false)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-slate-900">Create folder</h3>
            <p className="mt-1 text-xs text-slate-500">Shortcut: Enter to create</p>
            <input
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={async (e) => {
                if (e.key === "Enter" && newFolderName.trim()) {
                  await handleCreateFolder(newFolderName.trim());
                  setCreateFolderOpen(false);
                  setNewFolderName("");
                }
              }}
              placeholder="Folder name"
              className="mt-3 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
            />
            <div className="mt-3 flex justify-end gap-2">
              <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm" onClick={() => setCreateFolderOpen(false)}>
                Cancel
              </button>
              <button
                type="button"
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white"
                onClick={async () => {
                  if (!newFolderName.trim()) return;
                  await handleCreateFolder(newFolderName.trim());
                  setCreateFolderOpen(false);
                  setNewFolderName("");
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
};

export default Dashboard;
