import { useState } from "react";
import {
  ChevronRightIcon,
  FolderIcon,
  HomeIcon,
  PencilSquareIcon,
  TrashIcon
} from "@heroicons/react/24/outline";
import { motion } from "framer-motion";

const FolderList = ({ folders, breadcrumbs, onOpenFolder, onBreadcrumbClick, onDeleteFolder, onRenameFolder }) => {
  const [renamingId, setRenamingId] = useState(null);
  const [renameValue, setRenameValue] = useState("");

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

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-slate-800">Folders</h2>

      <div className="mb-4 flex flex-wrap items-center gap-1 text-xs text-slate-500">
        {breadcrumbs.map((crumb, index) => (
          <button
            key={crumb.id || "root"}
            type="button"
            className="flex items-center rounded-full px-2 py-1 hover:bg-slate-100"
            onClick={() => onBreadcrumbClick(index)}
          >
            {index === 0 ? <HomeIcon className="mr-1 h-3.5 w-3.5" /> : null}
            {crumb.name}
            {index < breadcrumbs.length - 1 ? <ChevronRightIcon className="ml-1 h-3.5 w-3.5" /> : null}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {folders.length ? (
          folders.map((folder) => (
            <motion.div
              key={folder._id}
              whileHover={{ y: -1 }}
              className="flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 transition"
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
                    className="text-xs font-medium text-green-600 hover:text-green-700"
                    onClick={() => confirmRename(folder._id)}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className="text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => {
                      setRenamingId(null);
                      setRenameValue("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm text-slate-700 hover:text-brand-700"
                    onClick={() => onOpenFolder(folder)}
                  >
                    <FolderIcon className="h-4 w-4 shrink-0 text-brand-600" />
                    <span className="truncate">{folder.name}</span>
                  </button>
                  <div className="flex items-center gap-2">
                    <button type="button" className="text-slate-500 hover:text-brand-700" onClick={() => startRename(folder)}>
                      <PencilSquareIcon className="h-4 w-4" />
                    </button>
                    <button type="button" className="text-slate-500 hover:text-red-600" onClick={() => onDeleteFolder(folder._id)}>
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))
        ) : (
          <div className="rounded-xl bg-slate-50 p-4 text-center text-xs text-slate-500">No folders here yet.</div>
        )}
      </div>
    </div>
  );
};

export default FolderList;
