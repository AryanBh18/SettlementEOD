import { getReportDownloadUrl } from "../api/client";

interface ReportExportProps { eodDate: string; }

export default function ReportExport({ eodDate }: ReportExportProps) {
  const handleDownload = () => {
    const token = sessionStorage.getItem("token");
    const url = getReportDownloadUrl(eodDate);
    fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
      .then((res) => { if (!res.ok) throw new Error("Download failed"); return res.blob(); })
      .then((blob) => { const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `eod_report_${eodDate}.csv`; a.click(); URL.revokeObjectURL(a.href); })
      .catch(() => alert("Failed to download report"));
  };

  return (
    <button onClick={handleDownload}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[--color-success] hover:opacity-90 transition-opacity">
      <span className="material-symbols-outlined text-base">csv</span>
      Export Report CSV
    </button>
  );
}

