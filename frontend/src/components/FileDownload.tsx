import { getFileDownloadUrl } from "../api/client";
import type { FileInfo } from "../api/client";

interface Props {
  fileInfo: FileInfo | null;
  eodDate: string;
}

function downloadWithAuth(url: string, filename: string) {
  const token = localStorage.getItem("token");
  fetch(url, { headers: { Authorization: `Bearer ${token ?? ""}` } })
    .then((res) => {
      if (!res.ok) throw new Error("Download failed");
      return res.blob();
    })
    .then((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      a.click();
      URL.revokeObjectURL(a.href);
    })
    .catch(() => alert("Download failed — please try again"));
}

export default function FileDownload({ fileInfo, eodDate }: Props) {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Settlement File</h3>
      {!fileInfo ? (
        <p style={styles.empty}>No file generated yet</p>
      ) : (
        <div>
          <div style={styles.detail}>
            <span style={styles.label}>File:</span>
            <span style={styles.value}>{fileInfo.file_name}</span>
          </div>
          <div style={styles.detail}>
            <span style={styles.label}>Status:</span>
            <span
              style={{
                ...styles.value,
                color: fileInfo.status === "SUCCESS" ? "#059669" : "#dc2626",
                fontWeight: 600,
              }}
            >
              {fileInfo.status}
            </span>
          </div>
          <div style={styles.detail}>
            <span style={styles.label}>Generated:</span>
            <span style={styles.value}>
              {new Date(fileInfo.created_at).toLocaleString()}
            </span>
          </div>
          <button
            onClick={() => downloadWithAuth(getFileDownloadUrl(eodDate), fileInfo.file_name)}
            disabled={fileInfo.status !== "SUCCESS"}
            style={{
              ...styles.downloadBtn,
              opacity: fileInfo.status === "SUCCESS" ? 1 : 0.4,
              cursor: fileInfo.status === "SUCCESS" ? "pointer" : "not-allowed",
              border: "none",
            }}
          >
            Download NSI (Technical)
          </button>
          <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
            Per-bank PDF statements available in the Statements section below.
          </p>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: "#fff",
    borderRadius: 8,
    padding: "20px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
  },
  title: { margin: "0 0 12px", fontSize: 16, fontWeight: 600 },
  empty: { color: "#9ca3af", fontSize: 14 },
  detail: {
    display: "flex",
    gap: 8,
    marginBottom: 6,
    fontSize: 13,
  },
  label: { color: "#6b7280", minWidth: 80 },
  value: { color: "#111827", fontFamily: "monospace" },
  downloadBtn: {
    display: "inline-block",
    marginTop: 12,
    padding: "8px 20px",
    background: "#059669",
    color: "#fff",
    borderRadius: 6,
    textDecoration: "none",
    fontSize: 13,
    fontWeight: 600,
  },
};
