import { useState, useRef } from "react";
import { uploadCSV, type UploadResult } from "../api/client";

export default function CSVUpload() {
  const [result, setResult] = useState<UploadResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setError(""); setResult(null); setLoading(true);
    try { const res = await uploadCSV(file); setResult(res); }
    catch (err: unknown) { setError((err as any)?.response?.data?.detail ?? "Upload failed"); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[--color-outline]">upload_file</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">CSV Transaction Upload</h3>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <label className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white cursor-pointer" style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
          <span className="material-symbols-outlined text-base">attach_file</span>
          {fileName ?? "Choose File"}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </label>
        <button onClick={handleUpload} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[--color-tertiary] disabled:opacity-60 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined text-base">upload</span>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-xs px-4 py-2.5 rounded-lg mb-3"><span className="material-symbols-outlined text-sm">error</span>{error}</div>}
      {result && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-3">
            {[["Imported", result.imported], ["Duplicates Skipped", result.skipped_duplicates], ["Total Processed", result.total_processed]].map(([l, v]) => (
              <div key={String(l)} className="bg-[--color-surface-low] rounded-lg p-3 text-center">
                <div className="text-[--color-on-surface-variant] text-[10px] uppercase tracking-wider font-semibold">{l}</div>
                <div className="font-display font-bold text-[--color-on-surface] text-lg mt-1">{v}</div>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <details className="mt-2">
              <summary className="cursor-pointer text-xs font-semibold text-[--color-error] flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                {result.errors.length} error(s)
              </summary>
              <div className="mt-2 rounded-lg overflow-hidden border border-[--color-outline-variant]">
                <table className="w-full text-xs">
                  <thead><tr className="bg-[--color-surface-low]"><th className="text-left px-4 py-2 font-semibold text-[--color-on-surface-variant]">Row</th><th className="text-left px-4 py-2 font-semibold text-[--color-on-surface-variant]">Message</th></tr></thead>
                  <tbody className="divide-y divide-[--color-surface-container]">
                    {result.errors.map((e, i) => (<tr key={i}><td className="px-4 py-2 font-mono text-[--color-on-surface-variant]">{e.row}</td><td className="px-4 py-2 text-[--color-error]">{e.message}</td></tr>))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </div>
      )}
    </div>
  );
}
