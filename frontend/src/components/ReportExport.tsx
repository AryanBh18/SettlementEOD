import { useState } from "react";
import { getReportDownloadUrl } from "../api/client";

interface ReportExportProps { eodDate: string; }

export default function ReportExport({ eodDate }: ReportExportProps) {
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloadError(null);
    setDownloading(true);
    try {
      const token = sessionStorage.getItem("token");
      const url = getReportDownloadUrl(eodDate);
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } });
      if (!res.ok) throw new Error(`Server returned ${res.status}`);
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `eod_report_${eodDate}.csv`;
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : "Failed to download report");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-sm text-xs font-bold uppercase tracking-widest text-white bg-success hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <span className="material-symbols-outlined text-base">csv</span>
        {downloading ? "Downloading..." : "Export Report CSV"}
      </button>
      {downloadError && (
        <div className="flex items-center gap-2 bg-error-light text-error text-xs px-3 py-2 rounded-sm border border-error/20">
          <span className="material-symbols-outlined text-sm">error</span>
          {downloadError}
        </div>
      )}
    </div>
  );
}
