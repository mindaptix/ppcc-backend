"use client";

import { useEffect, useRef } from "react";
import type { Draft } from "./notification-form";
import { Icon } from "./icon";

export function PreviewDialog({
  draft,
  onClose,
  onSave,
  onSend,
  sending = false,
}: {
  draft: Draft;
  onClose: () => void;
  onSave: () => void;
  onSend?: () => void;
  sending?: boolean;
}) {
  const dialog = useRef<HTMLElement>(null);

  useEffect(() => {
    const node = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    node?.querySelector<HTMLButtonElement>("button")?.focus();

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key !== "Tab" || !node) return;
      const buttons = [...node.querySelectorAll<HTMLButtonElement>("button:not(:disabled)")];
      if (!buttons.length) return;
      event.preventDefault();
      const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const next = event.shiftKey ? index - 1 : index + 1;
      buttons[(next + buttons.length) % buttons.length]?.focus();
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <section
        className="preview-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="preview-title"
        ref={dialog}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="dialog-head">
          <h2 id="preview-title">Preview</h2>
          <button type="button" onClick={onClose} disabled={sending} aria-label="Close preview">
            <Icon name="close" />
          </button>
        </div>
        <div className="phone-note">
          <span className="icon-tile">
            <Icon name="bell" />
          </span>
          <div>
            <strong>PPCC</strong>
            <small>Just now</small>
          </div>
        </div>
        <h3>{draft.title.trim() || "Notification title"}</h3>
        <p className="preview-message">{draft.message.trim() || "Message text will show here."}</p>
        <dl className="preview-meta">
          <div>
            <dt>District</dt>
            <dd>{draft.district}</dd>
          </div>
          <div>
            <dt>Audience</dt>
            <dd>{draft.audience}</dd>
          </div>
          <div>
            <dt>Send via</dt>
            <dd>{draft.channels.join(", ") || "None selected"}</dd>
          </div>
        </dl>
        <p className="preview-note">{onSend ? "Send this announcement to subscribed app devices with notifications enabled. Check the text before sending." : "This is only a preview. Unlock sending after Firebase is configured."}</p>
        <button
          type="button"
          className="btn primary"
          disabled={sending}
          onClick={() => {
            onSave();
            onClose();
          }}
        >
          <Icon name="save" size={16} />
          Save draft
        </button>
        {onSend && <button type="button" className="btn primary push-send" disabled={sending} onClick={onSend}><Icon name="send" size={16} />{sending ? "Sending…" : "Send notification to app users"}</button>}
      </section>
    </div>
  );
}
