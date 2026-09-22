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
    <form className="login-card" onSubmit={submit}>
      <span className="brand-mark">P</span>
      <h1>PPCC Admin</h1>
      <p>Punjab Pradesh Congress Committee</p>
      {error && <div className="login-error">{error}</div>}
      <label>
        Email
        <input
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </label>
      <label>
        Password
        <span className="password-field">
          <input
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          <button
            type="button"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            onClick={() => setShowPassword((current) => !current)}
          >
            <Icon name={showPassword ? "eyeOff" : "eye"} size={18} />
          </button>
        </span>
      </label>
      <button className="btn primary" type="submit" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
