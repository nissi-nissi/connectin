import { useState } from "react";

const FolderList = ({
  folders,
  breadcrumbs,
  onOpenFolder,
  onBreadcrumbClick,
  onCreateFolder,
  onDeleteFolder,
  onRenameFolder
}) => {
  const [newFolderName, setNewFolderName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    await onCreateFolder(newFolderName.trim());
    setNewFolderName("");
  };

  const startRename = (folder) => {
    setRenamingId(folder._id);
    setRenameValue(folder.name);
  };

  const confirmRename = async (folderId) => {
    if (renameValue.trim()) {
      await onRenameFolder(folderId, renameValue.trim());
    }
    setRenamingId(null);
    setRenameValue("");
  };

  const cancelRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h2 className="mb-2 text-sm font-semibold text-slate-800">Navigation</h2>
        <div className="flex flex-wrap gap-2">
          {breadcrumbs.map((crumb, index) => (
            <button
              key={crumb.id || "root"}
              type="button"
              aria-label={crumb.name}
              className="flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700 hover:bg-slate-200"
              onClick={() => onBreadcrumbClick(index)}
            >
              {index === 0 ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l9-9 9 9M4 10v10h16V10" />
                </svg>
              ) : null}
              {crumb.name}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-slate-800">Folders</h3>
        <div className="mb-3">
          {!showCreateForm ? (
            <button
              type="button"
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              New folder
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-600"
              />
              <button
                type="button"
                onClick={() => {
                  createFolder();
                  setShowCreateForm(false);
                }}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700"
              >
                Create
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewFolderName("");
                }}
                className="rounded-lg bg-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300"
              >
                Cancel
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          {folders.length ? (
            folders.map((folder) => (
              <div
                key={folder._id}
                className="flex items-center justify-between rounded-lg bg-slate-50 p-2"
              >
                {renamingId === folder._id ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand-600"
                    />
                    <button
                      type="button"
                      onClick={() => confirmRename(folder._id)}
                      className="text-xs text-green-600 hover:text-green-700"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelRename}
                      className="text-xs text-slate-500 hover:text-slate-700"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      type="button"
                      className="flex-1 truncate pr-2 text-left text-sm text-slate-700 hover:text-brand-700"
                      onClick={() => onOpenFolder(folder)}
                    >
                      📁 {folder.name}
                    </button>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="text-xs text-blue-600 hover:text-blue-700"
                        onClick={() => startRename(folder)}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className="text-xs text-red-600 hover:text-red-700"
                        onClick={() => onDeleteFolder(folder._id)}
                      >
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">No subfolders in this location.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default FolderList;
