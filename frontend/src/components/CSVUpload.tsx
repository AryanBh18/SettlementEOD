import { useState, useRef } from "react";
import { uploadCSV, getErrorMessage, type UploadResult } from "../api/client";

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
    catch (err: unknown) { setError(getErrorMessage(err, "Upload failed")); }
    finally { setLoading(false); }
  };

  return (
    <div className="bg-white border border-outline-variant shadow-[0_40px_40px_rgba(25,28,29,0.04)] p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="material-symbols-outlined text-outline">upload_file</span>
        <h3 className="font-display font-bold text-on-surface text-sm uppercase tracking-widest">CSV Transaction Upload</h3>
      </div>
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <label className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-white cursor-pointer"
          style={{ background: "linear-gradient(135deg, #0046c3, #0035a0)" }}>
          <span className="material-symbols-outlined text-base">attach_file</span>
          {fileName ?? "Choose File"}
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)} />
        </label>
        <button onClick={handleUpload} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-sm text-xs font-bold uppercase tracking-widest text-white bg-tertiary disabled:opacity-60 disabled:cursor-not-allowed">
          <span className="material-symbols-outlined text-base">upload</span>
          {loading ? "Uploading..." : "Upload"}
        </button>
      </div>
      {error && (
        <div className="flex items-center gap-2 bg-error-light text-error text-xs px-4 py-2.5 rounded-sm border border-error/20 mb-3">
          <span className="material-symbols-outlined text-sm">error</span>{error}
        </div>
      )}
      {result && (
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-3 gap-3">
            {([["Imported", result.imported], ["Duplicates Skipped", result.skipped_duplicates], ["Total Processed", result.total_processed]] as const).map(([l, v]) => (
              <div key={String(l)} className="bg-surface border border-outline-variant p-3 text-center">
                <div className="text-on-surface-variant text-[10px] uppercase tracking-widest font-bold">{l}</div>
                <div className="font-headline font-extrabold text-on-surface text-xl mt-1">{v}</div>
              </div>
            ))}
          </div>
          {result.errors.length > 0 && (
            <details className="mt-1">
              <summary className="cursor-pointer text-xs font-bold uppercase tracking-widest text-error flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">warning</span>
                {result.errors.length} error(s)
              </summary>
              <div className="mt-2 border border-outline-variant overflow-hidden">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-surface border-b border-outline-variant">
                      <th className="text-left px-4 py-2 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Row</th>
                      <th className="text-left px-4 py-2 font-bold text-on-surface-variant uppercase tracking-widest text-[10px]">Message</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.errors.map((e, i) => (
                      <tr key={i} className={`border-b border-outline-variant/40 ${i % 2 === 0 ? "bg-white" : "bg-surface-container-lowest"}`}>
                        <td className="px-4 py-2 font-mono text-on-surface-variant">{e.row}</td>
                        <td className="px-4 py-2 text-error">{e.message}</td>
                      </tr>
                    ))}
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
