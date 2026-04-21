import { useState, type FormEvent } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
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
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12"
        style={{ background: "linear-gradient(160deg, #a60b00 0%, #7a0800 60%, #1a0200 100%)" }}>
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">account_balance</span>
            </div>
            <span className="font-display font-bold text-white text-xl tracking-wide">BNETS</span>
          </div>
          <h1 className="font-display font-extrabold text-white text-4xl leading-tight mb-4">
            Interbank Clearing &amp;<br />Settlement System
          </h1>
          <p className="text-white/70 text-base leading-relaxed max-w-sm">
            Institutional-grade end-of-day multilateral netting for regulated financial institutions.
          </p>
        </div>
        <div className="flex gap-8">
          {[["account_balance_wallet", "Multilateral Netting"], ["verified", "Regulatory Compliance"], ["lock", "Secure Access"]].map(([icon, label]) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <span className="material-symbols-outlined text-white/60 text-2xl">{icon}</span>
              <span className="text-white/50 text-xs text-center">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-[--color-surface-low]">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <span className="material-symbols-outlined text-[--color-primary]">account_balance</span>
            <span className="font-display font-bold text-[--color-on-surface] text-lg">BNETS</span>
          </div>
          <h2 className="font-display font-bold text-[--color-on-surface] text-2xl mb-1">Sign in</h2>
          <p className="text-[--color-on-surface-variant] text-sm mb-8">Enter your credentials to continue</p>

          {error && (
            <div className="flex items-center gap-2 bg-[--color-primary-light] text-[--color-primary] text-sm px-4 py-3 rounded-lg mb-6">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <label className="text-[--color-on-surface-variant] text-xs font-semibold uppercase tracking-wider">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                className="w-full px-4 py-3 rounded-lg border border-[--color-outline-variant] bg-white text-[--color-on-surface] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
                placeholder="e.g. admin"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[--color-on-surface-variant] text-xs font-semibold uppercase tracking-wider">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full px-4 py-3 rounded-lg border border-[--color-outline-variant] bg-white text-[--color-on-surface] text-sm focus:outline-none focus:ring-2 focus:ring-[--color-primary] focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-lg font-semibold text-sm text-white transition-opacity disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #a60b00, #d31201)" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

