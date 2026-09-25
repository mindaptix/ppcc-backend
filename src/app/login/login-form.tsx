"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "@/components/icon";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not sign in.");
      window.location.href = "/";
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
      setBusy(false);
    }
  }

  return (
    <form className="flex flex-col justify-center bg-white px-5 py-6 sm:px-7 md:px-9 md:py-10" onSubmit={submit}>
      <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#046a38] uppercase">PPCC Admin</p>
      <h2 className="text-[1.7rem] font-semibold">Sign in</h2>
      <p className="mt-2 mb-5 text-sm text-[#5d6b7a]">Use the office email and password issued for this portal.</p>
      {error && (
        <div className="mb-3 rounded border border-[#f0d4d4] bg-[#fdf2f2] px-2.5 py-2 text-[13px] text-[#8a2b2b]">{error}</div>
      )}
      <label className="mb-3.5">
        Email
        <input
          className="text-base"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label className="mb-3.5">
        Password
        <span className="relative block">
          <input
            className="pr-11 text-base"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            className="absolute top-1.5 right-0.5 grid h-[calc(100%-6px)] w-9 place-items-center border-0 bg-transparent p-0 text-[#5d6b7a]"
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </span>
      </label>
      <button className="btn primary mt-1 w-full" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
