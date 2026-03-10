import { useState } from "react";

const formatBytes = (bytes) => {
  if (bytes === 0) return "0 B";
  if (!bytes) return "-";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const power = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / 1024 ** power;
  return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[power]}`;
};

const fileIcon = (mimeType) => {
  if (mimeType?.startsWith("image/")) return "IMG";
  if (mimeType?.startsWith("video/")) return "VID";
  if (mimeType?.startsWith("audio/")) return "AUD";
  if (mimeType === "application/pdf") return "PDF";
  return "DOC";
};

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

  const openRenamePrompt = async (file) => {
    const nextName = window.prompt("Enter new filename:", file.filename);
    if (nextName && nextName.trim() && nextName.trim() !== file.filename) {
      await onRename(file._id, nextName.trim());
    }
  };

  const doShare = async (fileId) => {
    const link = await onShare(fileId);
    if (link) {
      setShareLinks((prev) => ({ ...prev, [fileId]: link }));
    }
  };

  const moveFile = async (fileId, folderId) => {
    await onMove(fileId, folderId === "root" ? null : folderId);
  };

  return (
    <div className="rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-slate-900">Files</h3>
        <div className="rounded-lg bg-slate-100 p-1 text-xs flex">
          <button
            type="button"
            title="List view"
            className={`rounded px-2 py-1 ${viewMode === "list" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setViewMode("list")}
          >
            {/* list icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <button
            type="button"
            title="Grid view"
            className={`ml-1 rounded px-2 py-1 ${viewMode === "grid" ? "bg-white shadow-sm" : ""}`}
            onClick={() => setViewMode("grid")}
          >
            {/* grid icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h6v6H4V4zm10 0h6v6h-6V4zm0 10h6v6h-6v-6zm-10 0h6v6H4v-6z" />
            </svg>
          </button>
        </div>
      </div>

      {!files.length ? <p className="text-sm text-slate-500">No files found.</p> : null}

      {viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {files.map((file) => (
            <div key={file._id} className="rounded-xl border border-slate-200 p-3">
              <div className="mb-3 flex items-center gap-3">
                <div className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700">
                  {fileIcon(file.mimeType)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800">{file.filename}</p>
                  <p className="text-xs text-slate-500">{formatBytes(file.fileSize)}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2 text-xs">
                  <button
                    type="button"
                    title="Preview file"
                    className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200 flex items-center gap-1"
                    onClick={() => onPreview(file._id)}
                  >
                    {/* eye icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Download file"
                    className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200 flex items-center gap-1"
                    onClick={() => onDownload(file._id)}
                  >
                    {/* download icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5M12 15V3" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Rename file"
                    className="rounded bg-slate-100 px-2 py-1 hover:bg-slate-200 flex items-center gap-1"
                    onClick={() => openRenamePrompt(file)}
                  >
                    {/* pencil icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6m2-10l-6 6" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    title="Delete file"
                    className="rounded bg-red-100 px-2 py-1 text-red-700 hover:bg-red-200 flex items-center gap-1"
                    onClick={() => onDelete(file._id)}
                  >
                    {/* trash icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5-4h4m-4 0a1 1 0 011-1h2a1 1 0 011 1m-4 0v4" />
                    </svg>
                  </button>
                </div>

                <div className="flex gap-2 items-center">
                  <label htmlFor={`move-${file._id}`} className="sr-only">
                    Move to folder
                  </label>
                  <select
                    id={`move-${file._id}`}
                    className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs"
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
                    title="Move file"
                    className="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700 flex items-center gap-1"
                    onClick={() => moveFile(file._id, moveTargets[file._id] ?? (file.folderId || "root"))}
                  >
                    {/* folder arrow icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 5h10l-2-5h-4" />
                    </svg>
                    Move
                  </button>
                </div>

                <button
                  type="button"
                  title="Generate share link"
                  className="w-full rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 flex items-center justify-center gap-1"
                  onClick={() => doShare(file._id)}
                >
                    {/* link icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 5.656m1.414-1.414l5.656-5.656m0 0a4 4 0 115.656 5.656m-1.414-1.414l-5.656 5.656" />
                    </svg>
                    Share
                </button>

                {shareLinks[file._id] ? (
                  <a
                    className="block truncate text-xs text-brand-700 hover:underline"
                    href={shareLinks[file._id]}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {shareLinks[file._id]}
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs uppercase text-slate-500">
                <th className="py-2 pr-4">Name</th>
                <th className="py-2 pr-4">Size</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file._id} className="border-b border-slate-100">
                  <td className="py-2 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-slate-100 px-2 py-1 text-xs font-semibold">
                        {fileIcon(file.mimeType)}
                      </span>
                      <span className="max-w-[220px] truncate">{file.filename}</span>
                    </div>
                  </td>
                  <td className="py-2 pr-4">{formatBytes(file.fileSize)}</td>
                  <td className="py-2 pr-4">{file.mimeType}</td>
                  <td className="py-2 pr-4">{new Date(file.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        title="Preview"
                        className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 flex items-center gap-1"
                        onClick={() => onPreview(file._id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Download"
                        className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 flex items-center gap-1"
                        onClick={() => onDownload(file._id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 10l5 5 5-5M12 15V3" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Rename"
                        className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 flex items_center gap-1"
                        onClick={() => openRenamePrompt(file)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6 6m2-10l-6 6" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Delete"
                        className="rounded bg-red-100 px-2 py-1 text-xs text-red-700 hover:bg-red-200 flex items-center gap-1"
                        onClick={() => onDelete(file._id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m5-4h4m-4 0a1 1 0 011-1h2a1 1 0 011 1m-4 0v4" />
                        </svg>
                      </button>
                      <select
                        title="Move to folder"
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
                        title="Move"
                        className="rounded bg-brand-600 px-2 py-1 text-xs text-white hover:bg-brand-700 flex items-center gap-1"
                        onClick={() => moveFile(file._id, moveTargets[file._id] ?? (file.folderId || "root"))}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7h4l2 5h10l-2-5h-4" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        title="Share"
                        className="rounded bg-slate-100 px-2 py-1 text-xs hover:bg-slate-200 flex items-center gap-1"
                        onClick={() => doShare(file._id)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 5.656m1.414-1.414l5.656-5.656m0 0a4 4 0 115.656 5.656m-1.414-1.414l-5.656 5.656" />
                        </svg>
                      </button>
                    </div>
                    {shareLinks[file._id] ? (
                      <a
                        className="mt-1 block max-w-[260px] truncate text-xs text-brand-700 hover:underline"
                        href={shareLinks[file._id]}
                        target="_blank"
                        rel="noreferrer"
                      >
                        {shareLinks[file._id]}
                      </a>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FileList;
