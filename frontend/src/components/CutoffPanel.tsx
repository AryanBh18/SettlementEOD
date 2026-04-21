import { useState, useEffect } from "react";
import { triggerCutoff, getCutoffStatus, getCutoffSchedule, saveCutoffSchedule, type CutoffStatus } from "../api/client";

interface Props { selectedDate: string; onCutoffComplete: () => void; }

export default function CutoffPanel({ selectedDate, onCutoffComplete }: Props) {
  const [triggerLoading, setTriggerLoading] = useState(false);
  const [triggerError, setTriggerError] = useState<string | null>(null);
  const [cutoff, setCutoff] = useState<CutoffStatus | null>(null);
  const [fetching, setFetching] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("16:00");
  const [isAutoEnabled, setIsAutoEnabled] = useState(false);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const [scheduleSaved, setScheduleSaved] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      setFetching(true);
      try { const status = await getCutoffStatus(selectedDate); setCutoff(status); }
      catch { setCutoff(null); }
      finally { setFetching(false); }
    };
    fetchStatus();
  }, [selectedDate]);

  useEffect(() => {
    const fetchSchedule = async () => {
      try { const s = await getCutoffSchedule(); if (s) { setScheduleTime(s.cutoff_time); setIsAutoEnabled(s.is_auto_enabled); } }
      catch { }
    };
    fetchSchedule();
  }, []);

  const handleTrigger = async () => {
    setTriggerLoading(true); setTriggerError(null);
    try { const result = await triggerCutoff(selectedDate); setCutoff(result); onCutoffComplete(); }
    catch (err: any) { setTriggerError(err.response?.data?.detail || err.message || "Cutoff failed"); }
    finally { setTriggerLoading(false); }
  };

  const handleSaveSchedule = async () => {
    setScheduleLoading(true); setScheduleError(null); setScheduleSaved(false);
    try { const saved = await saveCutoffSchedule(scheduleTime, isAutoEnabled); setScheduleTime(saved.cutoff_time); setIsAutoEnabled(saved.is_auto_enabled); setScheduleSaved(true); setTimeout(() => setScheduleSaved(false), 3000); }
    catch (err: any) { setScheduleError(err.response?.data?.detail || err.message || "Failed to save schedule"); }
    finally { setScheduleLoading(false); }
  };

  const handleToggleAuto = async () => {
    const next = !isAutoEnabled;
    setIsAutoEnabled(next);
    setScheduleError(null); setScheduleSaved(false);
    try { const saved = await saveCutoffSchedule(scheduleTime, next); setScheduleTime(saved.cutoff_time); setIsAutoEnabled(saved.is_auto_enabled); setScheduleSaved(true); setTimeout(() => setScheduleSaved(false), 3000); }
    catch (err: any) { setIsAutoEnabled(!next); setScheduleError(err.response?.data?.detail || err.message || "Failed to update schedule"); }
  };

  return (
    <div className="bg-white rounded-xl border border-[--color-outline-variant] shadow-sm p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className="material-symbols-outlined text-[--color-outline]">schedule</span>
        <h3 className="font-display font-semibold text-[--color-on-surface] text-base">Cutoff Control</h3>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap mb-4">
        <div className="text-sm text-[--color-on-surface-variant]">
          {fetching ? "Loading cutoff status..."
            : cutoff ? <span>Cutoff active for <strong>{selectedDate}</strong> at <strong>{new Date(cutoff.cutoff_timestamp).toLocaleString()}</strong></span>
            : <span>No cutoff triggered for {selectedDate}</span>}
        </div>
        <button onClick={handleTrigger} disabled={triggerLoading || !!cutoff}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ background: cutoff ? "#9ca3af" : "linear-gradient(135deg, #b45309, #d97706)" }}>
          <span className="material-symbols-outlined text-base">{cutoff ? "lock" : "timer"}</span>
          {triggerLoading ? "Triggering..." : cutoff ? "Cutoff Set" : "Trigger Now"}
        </button>
      </div>
      {triggerError && <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-xs px-4 py-2.5 rounded-lg mb-3"><span className="material-symbols-outlined text-sm">error</span>{triggerError}</div>}

      <div className="border-t border-[--color-outline-variant] my-4" />
      <p className="text-[--color-on-surface-variant] text-sm font-semibold mb-3">
        Daily Schedule
        {isAutoEnabled && <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[--color-success-light] text-[--color-success]">Auto ON at {scheduleTime}</span>}
      </p>
      <div className="flex items-center gap-3 flex-wrap">
          <label className="flex items-center gap-2 text-sm text-[--color-on-surface-variant]">
            Cutoff Time:
            <input type="time" value={scheduleTime} onChange={(e) => setScheduleTime(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-[--color-outline-variant] text-sm text-[--color-on-surface] focus:outline-none focus:ring-1 focus:ring-[--color-primary]" />
          </label>
          <button onClick={handleToggleAuto}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
            style={{ background: isAutoEnabled ? "#1a7f4b" : "#74777b" }}>
            <span className="material-symbols-outlined text-base">{isAutoEnabled ? "toggle_on" : "toggle_off"}</span>
            Auto-Schedule: {isAutoEnabled ? "ON" : "OFF"}
          </button>
          <button onClick={handleSaveSchedule} disabled={scheduleLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-[--color-tertiary] disabled:opacity-60 disabled:cursor-not-allowed">
            <span className="material-symbols-outlined text-base">save</span>
            {scheduleLoading ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      {scheduleError && <div className="flex items-center gap-2 bg-[--color-error-light] text-[--color-error] text-xs px-4 py-2.5 rounded-lg mt-3"><span className="material-symbols-outlined text-sm">error</span>{scheduleError}</div>}
      {scheduleSaved && <div className="flex items-center gap-2 bg-[--color-success-light] text-[--color-success] text-xs px-4 py-2.5 rounded-lg mt-3"><span className="material-symbols-outlined text-sm filled">check_circle</span>Schedule saved successfully.</div>}
    </div>
  );
}
