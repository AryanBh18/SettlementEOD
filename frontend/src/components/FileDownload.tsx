import { useState } from "react";
import { getAllPdfsZipUrl } from "../api/client";
import type { FileInfo } from "../api/client";

interface Props { fileInfo: FileInfo | null; eodDate: string; }

export default function FileDownload({ fileInfo, eodDate }: Props) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const canDownload = !!fileInfo && fileInfo.status === "SUCCESS";

  const handleDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("token");
      const url = getAllPdfsZipUrl(eodDate);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `clearing_pdfs_${eodDate}.zip`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Download failed. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="material-symbols-outlined text-outline">folder_zip</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">Clearing Reports</h3>
      </div>
      {!fileInfo ? (
        <p className="text-outline text-sm">No reports generated yet. Run EOD first.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-outline-variant/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Status</span>
            <span className={`font-bold text-xs ${fileInfo.status === "SUCCESS" ? "text-success" : "text-error"}`}>{fileInfo.status}</span>
          </div>
          <div className="flex items-center justify-between text-xs py-1.5 border-b border-outline-variant/40">
            <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Generated</span>
            <span className="font-mono text-on-surface text-xs">{new Date(fileInfo.created_at).toLocaleString()}</span>
          </div>
          <button
            onClick={handleDownload}
            disabled={!canDownload || downloading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white mt-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: canDownload ? "linear-gradient(135deg, #a60b00, #d31201)" : undefined }}
          >
            <span className="material-symbols-outlined text-base">download</span>
            {downloading ? "Downloading..." : "Download All PDFs"}
          </button>
          {downloadError && (
            <div className="flex items-center gap-2 bg-error-light text-error text-xs px-3 py-2 rounded-sm border border-error/20">
              <span className="material-symbols-outlined text-sm">error</span>
              {downloadError}
            </div>
          )}
          <p className="text-outline text-[10px] text-center">ZIP containing clearing summary + per-bank statements</p>
        </div>
      )}
    </div>
  );
}
