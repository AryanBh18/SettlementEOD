import { getFileDownloadUrl } from "../api/client";
import type { FileInfo } from "../api/client";

interface Props {
  fileInfo: FileInfo | null;
  eodDate: string;
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
          <a
            href={getFileDownloadUrl(eodDate)}
            download
            style={{
              ...styles.downloadBtn,
              pointerEvents: fileInfo.status === "SUCCESS" ? "auto" : "none",
              opacity: fileInfo.status === "SUCCESS" ? 1 : 0.4,
            }}
          >
            Download NSI File
          </a>
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
