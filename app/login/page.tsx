"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Droplets, Lock } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: phone.trim(), password }),
    });
    const body = await res.json().catch(() => ({}));
    setBusy(false);
    if (res.ok) {
      router.push(body.redirect || "/admin");
      router.refresh();
    } else {
      setError(body.error || "Login failed.");
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-3xl border border-line bg-white p-8 shadow-[0_8px_30px_rgba(11,11,11,0.06)]"
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-accent-soft px-3 py-2 text-accent">
          <Droplets size={18} />
          <span className="text-sm font-semibold">Jubilee Water</span>
        </span>
        <h1 className="mt-5 text-2xl font-semibold flex items-center gap-2">
          <Lock size={18} className="text-ink-soft" /> Log in
        </h1>
        <p className="mt-1 text-sm text-ink-soft">
          Customers and staff: enter your phone number and password. Admin: leave the phone
          number blank.
        </p>
        <div className="mt-5 grid gap-3">
          <input
            type="text"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone number (blank for admin)"
            autoFocus
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={busy || !password}
          className="mt-5 w-full rounded-xl bg-accent text-white py-3 text-sm font-medium transition-colors hover:bg-accent-deep disabled:opacity-50"
        >
          {busy ? "Checking..." : "Log in"}
        </button>
      </form>
    </div>
  );
}
