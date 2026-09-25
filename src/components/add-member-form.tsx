"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "./icon";
import { PageIntro } from "./page-intro";

export function AddMemberForm() {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [mobile, setMobile] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function close() {
    if (busy) return;
    setOpen(false);
    setMobile("");
    setError("");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile: mobile.trim() }),
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "Could not save the number.");
      setOpen(false);
      setMobile("");
      setError("");
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save the number.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageIntro
        title="Members"
        text="Add a mobile number here. Only saved numbers can sign in to the app, and OTP is sent only to those numbers."
        action={
          <button type="button" className="btn primary" onClick={() => setOpen(true)}>
            Add number
          </button>
        }
      />
      {open && (
        <div className="modal-backdrop" onClick={close}>
          <form
            className="preview-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-number-title"
            onClick={(event) => event.stopPropagation()}
            onSubmit={submit}
          >
            <div className="dialog-head">
              <h2 id="add-number-title">Add a login number</h2>
              <button type="button" onClick={close} disabled={busy} aria-label="Close">
                <Icon name="close" />
              </button>
            </div>
            <label>
              Mobile number
              <input
                ref={input}
                name="mobile"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="10-digit mobile number"
                value={mobile}
                onChange={(event) => setMobile(event.target.value)}
                required
              />
            </label>
            <p className="field-hint mt-3">OTP is sent only after this number is saved. Any other number cannot sign in to the app.</p>
            {error && (
              <div className="mt-3 rounded border border-[#f0d4d4] bg-[#fdf2f2] px-2.5 py-2 text-[13px] text-[#8a2b2b]">{error}</div>
            )}
            <button className="btn primary mt-4 w-full" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Save number"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
