"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setBusy(false);
    if (res.ok) {
      router.push("/admin");
      router.refresh();
    } else {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Login failed.");
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line bg-white/70 p-8 shadow-[0_8px_30px_rgba(33,31,26,0.06)]"
      >
        <span className="inline-flex rounded-full bg-accent-soft p-3 text-accent">
          <Lock size={18} />
        </span>
        <h1 className="mt-4 font-serif text-2xl">Admin login</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Enter the admin password to manage the site.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          autoFocus
          className="mt-5 w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-xl bg-ink text-paper py-3 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
        >
          {busy ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
