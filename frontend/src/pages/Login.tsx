import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
    } catch {
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="hidden lg:flex lg:w-5/12 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: "linear-gradient(160deg, #a60b00 0%, #7a0800 60%, #1a0200 100%)" }}>
        {/* Subtle grid overlay */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-9 h-9 bg-white/15 flex items-center justify-center rounded-sm">
              <span className="material-symbols-outlined text-white text-xl">account_balance</span>
            </div>
            <div>
              <span className="font-display font-extrabold text-white text-lg tracking-tight leading-none block">BNETS</span>
              <span className="text-white/50 text-[10px] tracking-widest uppercase">Clearing &amp; Settlement</span>
            </div>
          </div>
          <h1 className="font-display font-extrabold text-white text-4xl leading-tight mb-5 tracking-tight">
            Interbank Clearing<br />&amp; Settlement<br />System
          </h1>
          <p className="text-white/60 text-sm leading-relaxed max-w-xs">
            Institutional-grade end-of-day multilateral netting for regulated financial institutions in Suriname.
          </p>
        </div>

        <div className="relative z-10">
          <div className="border-t border-white/10 pt-6 flex gap-8">
            {(["Multilateral Netting", "Regulatory Compliance", "Secure Access"] as const).map((label) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-white/30 text-[10px] font-bold uppercase tracking-widest">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-surface-low">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-10">
            <div className="w-7 h-7 flex items-center justify-center rounded-sm"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}>
              <span className="material-symbols-outlined text-white text-sm">account_balance</span>
            </div>
            <span className="font-display font-extrabold text-on-surface tracking-tight">BNETS</span>
          </div>

          <div className="mb-8">
            <h2 className="font-display font-extrabold text-on-surface text-2xl tracking-tight leading-none">Sign in</h2>
            <p className="text-on-surface-variant text-sm mt-2">Enter your credentials to access the system</p>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-primary-light text-primary text-sm px-4 py-3 rounded-sm border border-primary/20 mb-6">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-sm border border-outline-variant bg-white text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="e.g. admin"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-sm border border-outline-variant bg-white text-on-surface text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-sm text-xs font-bold uppercase tracking-widest text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed mt-2"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-outline text-[10px] text-center mt-8 uppercase tracking-widest">
            Centrale Bank van Suriname — Authorized Personnel Only
          </p>
        </div>
      </div>
    </div>
  );
}
