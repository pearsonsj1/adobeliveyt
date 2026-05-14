"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

export default function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errParam = searchParams.get("error");
  const nextParam = searchParams.get("next");

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    errParam === "missing_secret"
      ? "Sign-in cannot complete until ADMIN_SESSION_SECRET is set in your hosting environment (e.g. Netlify environment variables)."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const next =
        nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
          ? nextParam
          : "/admin";
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, next }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(data.error ?? "Unable to sign in. Verify your password and try again.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("A network error occurred. Please try again in a moment.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center px-4 sm:px-6">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/35 mb-2">Adobe Live</p>
          <div className="h-px w-12 mx-auto bg-gradient-to-r from-transparent via-[#FA0F00]/80 to-transparent mb-6" />
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-[#FA0F00] via-[#FF6B00] to-[#FFD200]" aria-hidden />
          <div className="p-8 sm:p-10">
            <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-white mb-1">Analytics</h1>
            <p className="text-white/45 text-sm leading-relaxed mb-8">
              Authorized access only. Enter the site password to view engagement metrics.
            </p>

            <form onSubmit={onSubmit} className="space-y-5">
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-[11px] font-semibold uppercase tracking-wider text-white/40 mb-2"
                >
                  Password
                </label>
                <input
                  id="admin-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-black/50 border border-white/[0.1] text-[15px] text-white placeholder:text-white/25 focus:outline-none focus:ring-1 focus:ring-[#FA0F00]/60 focus:border-[#FA0F00]/35 transition-shadow"
                  placeholder="Enter password"
                  required
                />
              </div>

              {error && (
                <div
                  className="rounded-lg border border-red-500/25 bg-red-500/[0.06] px-4 py-3 text-sm text-red-200/90 leading-snug"
                  role="alert"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-lg bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-semibold tracking-wide transition-colors disabled:opacity-45 disabled:pointer-events-none"
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
          </div>
        </div>

        <p className="mt-8 text-center">
          <Link
            href="/"
            className="text-[13px] text-white/35 hover:text-white/55 transition-colors"
          >
            Return to site home
          </Link>
        </p>
      </div>
    </div>
  );
}
