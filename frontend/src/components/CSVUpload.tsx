import { useState, useRef } from "react";
import { uploadCSV, type UploadResult } from "../api/client";

export default function CSVUpload() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;

    setError("");
    setResult(null);
    setLoading(true);
    try {
      const res = await uploadCSV(file);
      setResult(res);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ?? "Upload failed";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#fff", padding: "1rem", borderRadius: 8, border: "1px solid #e0e0e0" }}>
      <h3 style={{ marginTop: 0 }}>CSV Transaction Upload</h3>
      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "1rem" }}>
        <input ref={fileRef} type="file" accept=".csv" />
        <button onClick={handleUpload} disabled={loading} style={{ padding: "0.4rem 1rem", cursor: "pointer" }}>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>

      {error && <div style={{ color: "#c00", marginBottom: "0.5rem" }}>{error}</div>}

      {result && (
        <div>
          <p>
            <strong>Imported:</strong> {result.imported} |{" "}
            <strong>Duplicates skipped:</strong> {result.skipped_duplicates} |{" "}
            <strong>Total processed:</strong> {result.total_processed}
          </p>
          {result.errors.length > 0 && (
            <details>
              <summary style={{ cursor: "pointer", color: "#c00" }}>{result.errors.length} error(s)</summary>
              <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "#f9f9f9" }}>
                    <th style={{ padding: 4, textAlign: "left", borderBottom: "1px solid #ddd" }}>Row</th>
                    <th style={{ padding: 4, textAlign: "left", borderBottom: "1px solid #ddd" }}>Message</th>
                  </tr>
                </thead>
                <tbody>
                  {result.errors.map((e, i) => (
                    <tr key={i}>
                      <td style={{ padding: 4, borderBottom: "1px solid #eee" }}>{e.row}</td>
                      <td style={{ padding: 4, borderBottom: "1px solid #eee" }}>{e.message}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
