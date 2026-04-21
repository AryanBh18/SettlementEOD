import { getAllPdfsZipUrl } from "../api/client";
import type { FileInfo } from "../api/client";

interface Props { fileInfo: FileInfo | null; eodDate: string; }

function downloadWithAuth(url: string, filename: string) {
  const token = sessionStorage.getItem("token");
  fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
    .then((res) => { if (!res.ok) throw new Error("Download failed"); return res.blob(); })
    .then((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename; a.click(); URL.revokeObjectURL(a.href); })
    .catch(() => alert("Download failed. Please try again."));
}

export default function FileDownload({ fileInfo, eodDate }: Props) {
  const canDownload = !!fileInfo && fileInfo.status === "SUCCESS";
  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[--color-outline]">folder_zip</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Clearing Reports</h3>
      </div>
      {!fileInfo ? (
        <p className="text-[--color-outline] text-sm">No reports generated yet. Run EOD first.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[--color-on-surface-variant]">Status</span>
            <span className={`font-semibold ${fileInfo.status === "SUCCESS" ? "text-[--color-success]" : "text-[--color-error]"}`}>{fileInfo.status}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-[--color-on-surface-variant]">Generated</span>
            <span className="font-mono text-[--color-on-surface]">{new Date(fileInfo.created_at).toLocaleString()}</span>
          </div>
          <button
            onClick={() => downloadWithAuth(getAllPdfsZipUrl(eodDate), `clearing_pdfs_${eodDate}.zip`)}
            disabled={!canDownload}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white mt-2 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
            style={{ background: canDownload ? "linear-gradient(135deg, #a60b00, #d31201)" : undefined }}
          >
            <span className="material-symbols-outlined text-base">download</span>
            Download All PDFs
          </button>
          <p className="text-[--color-outline] text-[10px] text-center">ZIP containing clearing summary + per-bank statements</p>
        </div>
      )}
    </div>
  );
}