"use client";

import { Icon } from "./icon";

export function Toast({ message, onClose }: { message: string; onClose: () => void }) {
  if (!message) return null;

  return (
    <div className="toast" role="status">
      <p>{message}</p>
      <button type="button" onClick={onClose} aria-label="Dismiss">
        <Icon name="close" size={16} />
      </button>
    </div>
  );
}
