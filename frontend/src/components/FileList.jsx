import { useEffect, useMemo, useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentIcon,
  EllipsisVerticalIcon,
  EyeIcon,
  LinkIcon,
  MusicalNoteIcon,
  PencilSquareIcon,
  PhotoIcon,
  Squares2X2Icon,
  TableCellsIcon,
  TrashIcon,
  VideoCameraIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[power]}`;
};

const fileIcon = (mimeType) => {
  if (mimeType?.startsWith("image/")) return PhotoIcon;
  if (mimeType?.startsWith("video/")) return VideoCameraIcon;
  if (mimeType?.startsWith("audio/")) return MusicalNoteIcon;
  return DocumentIcon;
};

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
    <div
      className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
      onClick={(e) => e.stopPropagation()}
      role="dialog"
      aria-modal="true"
    >
      <div className="mb-3 flex items-center justify-between">
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
        <button type="button" onClick={onClose} className="text-xs text-slate-500 hover:text-slate-700">
          Esc
        </button>
      </div>
      {children}
    </div>
  </div>
);

const FileList = ({
  files,
  allFolders,
  viewMode,
  setViewMode,
  onDelete,
  onRename,
  onMove,
  onShare,
  onDownload,
  onPreview
}) => {
  const [moveTargets, setMoveTargets] = useState({});
  const [shareLinks, setShareLinks] = useState({});
  const [contextMenu, setContextMenu] = useState(null);
  const [renameFile, setRenameFile] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareFile, setShareFile] = useState(null);
  const [shareExpiration, setShareExpiration] = useState("24");

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const recentFiles = useMemo(
    () => [...files].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5),
    [files]
  );

  const doShare = async (fileId, expiresInHours) => {
    const link = await onShare(fileId, expiresInHours);
    if (link) {
      setShareLinks((prev) => ({ ...prev, [fileId]: link }));
      return link;
    }
    return null;
  };

  const openRenameDialog = (file) => {
    setRenameFile(file);
    setRenameValue(file.filename);
    setContextMenu(null);
  };

  const handleContextMenu = (event, file) => {
    event.preventDefault();
    setContextMenu({ file, x: event.clientX, y: event.clientY });
  };

  const moveFile = async (fileId, folderId) => {
    await onMove(fileId, folderId === "root" ? null : folderId);
  };

  return (
    <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">My Files</h3>
        <div className="flex rounded-lg bg-slate-100 p-1 text-xs">
          <button
            type="button"
            title="List view"
            className={`rounded px-2 py-1 ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setViewMode("list")}
          >
            <TableCellsIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            title="Grid view"
            className={`ml-1 rounded px-2 py-1 ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            <Squares2X2Icon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {!files.length ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <DocumentIcon className="mx-auto h-10 w-10 text-slate-400" />
          <p className="mt-2 text-sm text-slate-600">No files yet. Upload your first document.</p>
        </div>
      ) : null}

      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => {
            const Icon = fileIcon(file.mimeType);
            return (
              <motion.div
                key={file._id}
                whileHover={{ y: -3 }}
                onContextMenu={(event) => handleContextMenu(event, file)}
                className="rounded-xl border border-slate-200 p-3 transition-shadow hover:shadow-md"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <Icon className="h-5 w-5 shrink-0 text-brand-600" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{file.filename}</p>
                      <p className="text-xs text-slate-500">{formatBytes(file.fileSize)}</p>
                    </div>
                  </div>
                  <button type="button" onClick={(e) => handleContextMenu(e, file)} className="text-slate-500">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => onPreview(file._id)}>
                    <EyeIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => onDownload(file._id)}>
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => openRenameDialog(file)}>
                    <PencilSquareIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => setShareFile(file)}>
                    <LinkIcon className="h-4 w-4" />
                  </button>
                  <button type="button" className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200" onClick={() => onDelete(file._id)}>
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase tracking-wide text-slate-500">
                <th className="py-3 pr-4">Name</th>
                <th className="py-3 pr-4">Size</th>
                <th className="py-3 pr-4">Type</th>
                <th className="py-3 pr-4">Created</th>
                <th className="py-3 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => {
                const Icon = fileIcon(file.mimeType);
                return (
                  <tr
                    key={file._id}
                    onContextMenu={(event) => handleContextMenu(event, file)}
                    className="border-b border-slate-100 hover:bg-slate-50"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-brand-600" />
                        <span className="max-w-[220px] truncate">{file.filename}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4">{formatBytes(file.fileSize)}</td>
                    <td className="py-3 pr-4">{file.mimeType}</td>
                    <td className="py-3 pr-4">{new Date(file.createdAt).toLocaleString()}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => onPreview(file._id)}>
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => onDownload(file._id)}>
                          <ArrowDownTrayIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => openRenameDialog(file)}>
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button type="button" className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200" onClick={() => setShareFile(file)}>
                          <LinkIcon className="h-4 w-4" />
                        </button>
                        <select
                          className="rounded border border-slate-300 px-2 py-1 text-xs"
                          value={moveTargets[file._id] ?? (file.folderId || "root")}
                          onChange={(e) =>
                            setMoveTargets((prev) => ({
                              ...prev,
                              [file._id]: e.target.value
                            }))
                          }
                        >
                          <option value="root">Root</option>
                          {allFolders.map((folder) => (
                            <option key={folder._id} value={folder._id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700"
                          onClick={() => moveFile(file._id, moveTargets[file._id] ?? (file.folderId || "root"))}
                        >
                          Move
                        </button>
                        <button type="button" className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200" onClick={() => onDelete(file._id)}>
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                      {shareLinks[file._id] ? (
                        <a className="mt-1 block max-w-[260px] truncate text-xs text-brand-700 hover:underline" href={shareLinks[file._id]} target="_blank" rel="noreferrer">
                          {shareLinks[file._id]}
                        </a>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {recentFiles.length ? (
        <div className="rounded-xl bg-slate-50 p-3">
          <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Recent activity</h4>
          <ul className="space-y-1 text-xs text-slate-600">
            {recentFiles.map((file) => (
              <li key={`activity-${file._id}`} className="flex justify-between gap-2">
                <span className="truncate">{file.filename}</span>
                <span>{new Date(file.createdAt).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {contextMenu ? (
        <div className="fixed z-50 w-44 rounded-lg border border-slate-200 bg-white p-1 shadow-lg" style={{ top: contextMenu.y, left: contextMenu.x }}>
          <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-100" onClick={() => onMove(contextMenu.file._id, null)}>
            Move to Root
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-100" onClick={() => openRenameDialog(contextMenu.file)}>
            Rename
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm hover:bg-slate-100" onClick={() => setShareFile(contextMenu.file)}>
            Share
          </button>
          <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-sm text-red-600 hover:bg-red-50" onClick={() => onDelete(contextMenu.file._id)}>
            Delete
          </button>
        </div>
      ) : null}

      {renameFile ? (
        <Modal title="Rename file" onClose={() => setRenameFile(null)}>
          <p className="mb-2 text-xs text-slate-500">Shortcut: Enter to save</p>
          <input
            autoFocus
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === "Enter" && renameValue.trim()) {
                await onRename(renameFile._id, renameValue.trim());
                setRenameFile(null);
              }
            }}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm" onClick={() => setRenameFile(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white"
              onClick={async () => {
                if (!renameValue.trim()) return;
                await onRename(renameFile._id, renameValue.trim());
                setRenameFile(null);
              }}
            >
              Save
            </button>
          </div>
        </Modal>
      ) : null}

      {shareFile ? (
        <Modal title="Share file" onClose={() => setShareFile(null)}>
          <p className="mb-2 text-xs text-slate-500">Set expiration in hours (optional)</p>
          <input
            type="number"
            min="1"
            value={shareExpiration}
            onChange={(e) => setShareExpiration(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
          />
          <div className="mt-3 flex justify-end gap-2">
            <button type="button" className="rounded-lg bg-slate-100 px-3 py-2 text-sm" onClick={() => setShareFile(null)}>
              Cancel
            </button>
            <button
              type="button"
              className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white"
              onClick={async () => {
                await doShare(shareFile._id, Number(shareExpiration) || undefined);
                setShareFile(null);
              }}
            >
              Create Link
            </button>
          </div>
        </Modal>
      ) : null}
    </div>
  );
};

export default FileList;
