import { getReportDownloadUrl } from "../api/client";

interface ReportExportProps {
  eodDate: string;
}

export default function ReportExport({ eodDate }: ReportExportProps) {
  const handleDownload = () => {
    const token = localStorage.getItem("token");
    const url = getReportDownloadUrl(eodDate);
    // Open with auth header via fetch + blob
    fetch(url, {
      headers: { Authorization: `Bearer ${token ?? ""}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Download failed");
        return res.blob();
      })
      .then((blob) => {
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `eod_report_${eodDate}.csv`;
        a.click();
        URL.revokeObjectURL(a.href);
      })
      .catch(() => alert("Failed to download report"));
  };

  return (
    <button
      onClick={handleDownload}
      style={{ padding: "0.4rem 1rem", cursor: "pointer", background: "#28a745", color: "#fff", border: "none", borderRadius: 4 }}
    >
      Export Report CSV
    </button>
  );
}
