const FilePreview = ({ file, onClose }) => {
  if (!file) return null;

  const { previewUrl, filename, mimeType } = file;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 p-4">
      <div className="max-h-[90vh] w-full max-w-3xl overflow-auto rounded-xl bg-white p-4 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="truncate pr-4 text-lg font-semibold text-slate-900">{filename}</h3>
          <div className="flex gap-2">
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              title="Open or download file"
              className="rounded-lg bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200"
            >
              Download
            </a>
            <button
              type="button"
              className="rounded-lg bg-slate-100 px-3 py-1 text-sm hover:bg-slate-200"
              onClick={onClose}
            >
              Close
            </button>
          </div>
        </div>

        {mimeType?.startsWith("image/") ? (
          <img src={previewUrl} alt={filename} className="max-h-[70vh] w-full rounded-lg object-contain" />
        ) : null}

        {mimeType?.startsWith("video/") ? (
          <video src={previewUrl} controls className="max-h-[70vh] w-full rounded-lg bg-black" />
        ) : null}

        {mimeType?.startsWith("audio/") ? (
          <audio src={previewUrl} controls className="w-full" />
        ) : null}

        {!mimeType?.startsWith("image/") &&
        !mimeType?.startsWith("video/") &&
        !mimeType?.startsWith("audio/") ? (
          <div className="rounded-lg border border-slate-200 p-5 text-center">
            <p className="mb-2 text-sm text-slate-600">Preview is not available for this file type.</p>
            <a
              href={previewUrl}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Open file in new tab
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default FilePreview;
