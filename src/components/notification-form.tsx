"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { parseBroadcast } from "@/lib/push-contract";
import { audiences, channels, districtOptions } from "@/lib/portal-data";
import { Icon, type IconName } from "./icon";
import { PreviewDialog } from "./preview-dialog";
import { Toast } from "./toast";

export type Draft = {
  title: string;
  message: string;
  district: string;
  audience: string;
  channels: string[];
};

const storageKey = "ppcc-notification-draft";

const emptyDraft: Draft = {
  title: "",
  message: "",
  district: "All Punjab",
  audience: "All members",
  channels: ["Push notification"],
};

const channelIcons: Record<(typeof channels)[number], IconName> = {
  "Push notification": "bell",
  SMS: "send",
  "Show in app": "home",
};

const legacyChannels: Record<string, string> = {
  "App push": "Push notification",
  "Publish in app": "Show in app",
};

const legacyDistricts: Record<string, string> = {
  "Sahibzada Ajit Singh Nagar": "Mohali (S.A.S. Nagar)",
  "Sri Muktsar Sahib": "Muktsar (Sri Muktsar Sahib)",
  "Shaheed Bhagat Singh Nagar": "Nawanshahr (S.B.S. Nagar)",
  Rupnagar: "Rupnagar (Ropar)",
};

function readDraft(raw: string): Draft {
  const value = JSON.parse(raw) as Partial<Draft>;
  if (!value || typeof value.title !== "string" || typeof value.message !== "string") {
    throw new Error("invalid draft");
  }
  const district = legacyDistricts[value.district ?? ""] ?? value.district;
  if (typeof district !== "string" || !districtOptions.includes(district as (typeof districtOptions)[number])) {
    throw new Error("invalid district");
  }
  if (!audiences.includes(value.audience as (typeof audiences)[number])) {
    throw new Error("invalid audience");
  }
  if (!Array.isArray(value.channels)) throw new Error("invalid channels");

  const nextChannels = value.channels.map((item) => {
    if (typeof item !== "string") throw new Error("invalid channel");
    return legacyChannels[item] ?? item;
  });
  if (!nextChannels.every((item) => channels.includes(item as (typeof channels)[number]))) {
    throw new Error("invalid channel");
  }

  return {
    title: value.title,
    message: value.message,
    district,
    audience: value.audience as string,
    channels: nextChannels,
  };
}

export function NotificationForm() {
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [notice, setNotice] = useState("");
  const [preview, setPreview] = useState(false);
  const [connection, setConnection] = useState<{ configured: boolean; authenticated: boolean } | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [busy, setBusy] = useState(false);
  const sending = useRef(false);
  const closePreview = useCallback(() => { if (!sending.current) setPreview(false); }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/admin/push/session", { cache: "no-store", signal: controller.signal })
      .then(response => { if (!response.ok) throw new Error(); return response.json(); })
      .then(setConnection)
      .catch(() => { if (!controller.signal.aborted) setNotice("Could not check notification connection. Refresh to try again."); });
    return () => controller.abort();
  }, []);

  async function unlock() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/push/session", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secret: accessCode }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setConnection({ configured: true, authenticated: true });
      setAccessCode("");
      setNotice("Sending is unlocked for this admin session.");
    } catch (error) { setNotice(error instanceof Error ? error.message : "Could not unlock sending."); }
    finally { setBusy(false); }
  }

  async function lock() {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/push/session", { method: "DELETE" });
      if (!response.ok) throw new Error();
      setConnection(current => current && { ...current, authenticated: false });
    } catch { setNotice("Could not lock this session. Please try again."); }
    finally { setBusy(false); }
  }

  async function sendNotification() {
    if (sending.current) return;
    try { parseBroadcast(draft); } catch (error) { setNotice((error as Error).message); return; }
    sending.current = true;
    setBusy(true);
    try {
      const response = await fetch("/api/admin/notifications", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(draft) });
      const result = await response.json();
      if (response.status === 401) setConnection(current => current && { ...current, authenticated: false });
      if (!response.ok) throw new Error(result.error || "Could not send notification.");
      setNotice(result.message);
      setPreview(false);
      setDraft({ ...emptyDraft });
      // Clear a previously saved copy so Restore draft does not accidentally resend it.
      try { localStorage.removeItem(storageKey); } catch { /* Sending has already succeeded. */ }
    } catch (error) {
      setNotice(error instanceof TypeError ? "Could not confirm sending. Check Firebase before trying again to avoid duplicates." : error instanceof Error ? error.message : "Could not confirm sending.");
    } finally { sending.current = false; setBusy(false); }
  }

  function update(key: keyof Draft, value: string) {
    setDraft({ ...draft, [key]: value });
  }

  function saveDraft() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(draft));
      setNotice("Draft saved in this browser.");
    } catch {
      setNotice("This browser blocked saving the draft.");
    }
  }

  function restoreDraft() {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setNotice("No draft saved in this browser.");
        return;
      }
      setDraft(readDraft(saved));
      setNotice("Draft restored.");
    } catch {
      setNotice("Could not read the saved draft.");
    }
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    try { parseBroadcast(draft); } catch (error) { setNotice((error as Error).message); return; }
    if (!draft.title.trim() || !draft.message.trim()) {
      setNotice("Enter a title and a message.");
      return;
    }
    if (!draft.channels.length) {
      setNotice("Select at least one way to send it.");
      return;
    }
    setPreview(true);
  }

  return (
    <>
      <form className="panel form-panel" onSubmit={submit}>
        <div className="panel-head">
          <h2>New notification</h2>
        </div>
        <div className="form-body">
          <div className="push-connection" role="status">
            <Icon name="bell" size={18} />
            <p>{!connection ? "Checking notification connection…" : !connection.configured ? "Notifications are not connected yet. Firebase setup is needed before sending." : connection.authenticated ? "Ready to send to app devices subscribed to announcements." : "Notification setup found. Unlock sending with your admin access code."}</p>
            {connection?.authenticated && <button type="button" className="btn ghost" disabled={busy} onClick={lock}>Lock sending</button>}
          </div>
          {connection?.configured && !connection.authenticated && <div className="push-unlock"><label>Admin access code<input type="password" autoComplete="off" value={accessCode} onChange={event => setAccessCode(event.target.value)} placeholder="Enter the administrator’s access code" /></label><button className="btn" type="button" disabled={busy || !accessCode} onClick={unlock}>Unlock sending</button></div>}
          <div className="field-row">
            <label>
              District
              <span className="select">
                <Icon name="pin" size={16} />
                <select value={draft.district} onChange={(event) => update("district", event.target.value)}>
                  {districtOptions.map((district) => (
                    <option key={district} disabled={district !== "All Punjab"}>{district}</option>
                  ))}
                </select>
              </span>
            </label>
            <label>
              Audience
              <span className="select">
                <Icon name="users" size={16} />
                <select value={draft.audience} onChange={(event) => update("audience", event.target.value)}>
                  {audiences.map((audience) => (
                    <option key={audience} disabled={audience !== "All members"}>{audience}</option>
                  ))}
                </select>
              </span>
            </label>
          </div>
          <p className="field-hint">
            Broadcast to subscribed app devices. District and role targeting are not connected yet.
          </p>
          <label>
            Title <span className="req">*</span>
            <input
              required
              maxLength={120}
              value={draft.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder="District meeting on 28 September"
            />
          </label>
          <label>
            Message <span className="req">*</span>
            <textarea
              required
              maxLength={3000}
              value={draft.message}
              onChange={(event) => update("message", event.target.value)}
              placeholder="Write the notice. Add the date, time, and place if there is a meeting."
            />
            <span className="char-count">{draft.message.length.toLocaleString()} / 3,000</span>
          </label>
          <fieldset>
            <legend>How to send</legend>
            <div className="checks">
              {channels.map((label) => (
                <label key={label} className={draft.channels.includes(label) ? "check on" : "check"}>
                  <input
                    type="checkbox"
                    disabled={label !== "Push notification"}
                    checked={draft.channels.includes(label)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        channels: event.target.checked
                          ? [...draft.channels, label]
                          : draft.channels.filter((item) => item !== label),
                      })
                    }
                  />
                  <Icon name={channelIcons[label]} size={16} />
                  {label}
                  {label !== "Push notification" && <small>(not connected)</small>}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
        <div className="panel-foot">
          <button type="button" className="btn ghost" onClick={saveDraft}>
            <Icon name="save" size={16} />
            Save draft
          </button>
          <button type="button" className="btn ghost" onClick={restoreDraft}>
            Restore draft
          </button>
          <div className="foot-gap" />
          <button type="button" className="btn" onClick={() => setPreview(true)}>
            <Icon name="eye" size={16} />
            Preview
          </button>
          <button type="submit" className="btn primary" disabled={busy || !connection?.authenticated}>
            <Icon name="send" size={16} />
            Review & send
          </button>
        </div>
      </form>
      <Toast message={notice} onClose={() => setNotice("")} />
      {preview && <PreviewDialog draft={draft} onClose={closePreview} onSave={saveDraft} onSend={connection?.authenticated ? sendNotification : undefined} sending={busy} />}
    </>
  );
}
