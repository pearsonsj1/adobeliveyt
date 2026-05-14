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
      ? "Server is missing ADMIN_SESSION_SECRET. Add it in Netlify environment variables."
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
        setError(data.error ?? "Sign-in failed.");
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#070707] text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-8 shadow-2xl">
        <h1 className="text-xl font-black tracking-tight mb-1">Admin sign-in</h1>
        <p className="text-white/40 text-sm mb-6">Analytics dashboard — password required.</p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label htmlFor="admin-password" className="sr-only">
              Password
            </label>
            <input
              id="admin-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white placeholder:text-white/25 focus:outline-none focus:ring-2 focus:ring-[#FA0F00]/50 focus:border-[#FA0F00]/40"
              placeholder="Password"
              required
            />
          </div>
          {error && (
            <p className="text-sm text-[#ff6b6b]" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-[#FA0F00] hover:bg-[#d40d00] text-white text-sm font-bold transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-center text-white/30 text-xs">
          <Link href="/" className="hover:text-white/50 transition-colors">
            ← Back to site
          </Link>
        </p>
      </div>
    </div>
  );
}
