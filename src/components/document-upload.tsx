"use client";

import { useEffect, useRef, useState } from "react";
import { districtOptions } from "@/lib/portal-data";
import { acceptAttribute, clientFileError } from "@/lib/upload-rules";
import { Icon, type IconName } from "./icon";
import { Toast } from "./toast";

type SavedFile = {
  id: string;
  district: string;
  original_name: string;
  byte_size: number;
  kind: "image" | "video" | "document";
  created_at: string;
};

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileIcon(kind: SavedFile["kind"] | "pending", name: string): IconName {
  if (kind === "image" || /\.(png|jpe?g|gif|webp|heic|heif)$/i.test(name)) return "image";
  if (kind === "video" || /\.(mp4|webm|mov)$/i.test(name)) return "video";
  return "file";
}

export function DocumentUpload() {
  const input = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [saved, setSaved] = useState<SavedFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const [notice, setNotice] = useState("");
  const [district, setDistrict] = useState("All Punjab");
  const [busy, setBusy] = useState(false);

  async function loadSaved() {
    const response = await fetch("/api/admin/uploads", { cache: "no-store" });
    if (!response.ok) return;
    const result = (await response.json()) as { files?: SavedFile[] };
    setSaved(result.files ?? []);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadSaved();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  function addFiles(incoming: FileList | null) {
    if (!incoming) return;
    const accepted: File[] = [];
    const errors: string[] = [];
    for (const file of Array.from(incoming)) {
      const error = clientFileError(file.name, file.size);
      if (error) errors.push(error);
      else accepted.push(file);
    }
    setFiles((current) => {
      const next = [...current];
      for (const file of accepted) {
        if (!next.some((item) => item.name === file.name && item.size === file.size)) next.push(file);
      }
      return next;
    });
    setNotice(errors.join(" "));
    if (input.current) input.current.value = "";
  }

  async function upload() {
    if (!files.length || busy) return;
    setBusy(true);
    const body = new FormData();
    body.set("district", district);
    for (const file of files) body.append("files", file);
    try {
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const result = (await response.json()) as { error?: string; errors?: string[]; files?: SavedFile[] };
      if (response.status === 401) throw new Error("Sign in required.");
      if (!response.ok && result.error) throw new Error(result.error);
      if (result.files?.length) {
        setFiles([]);
        await loadSaved();
      }
      const rejected = result.errors?.filter(Boolean).join(" ") ?? "";
      setNotice(rejected || (result.files?.length ? "Files saved." : result.error || "Nothing was saved."));
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not upload the files.");
    } finally {
      setBusy(false);
    }
  }

  const groups = districtOptions
    .map((name) => ({ name, items: saved.filter((file) => file.district === name) }))
    .filter((group) => group.items.length > 0);

  return (
    <>
      <section className="panel">
        <div className="panel-head">
          <h2>Upload</h2>
        </div>
        <div className="form-body">
          <input
            ref={input}
            className="visually-hidden"
            type="file"
            multiple
            accept={acceptAttribute}
            aria-label="Choose files"
            onChange={(event) => addFiles(event.target.files)}
          />
          <button
            type="button"
            className={dragging ? "dropzone dragging" : "dropzone"}
            onClick={() => input.current?.click()}
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              addFiles(event.dataTransfer.files);
            }}
          >
            <Icon name="upload" size={22} />
            <strong>Drop files here</strong>
            <span>or choose from this computer</span>
            <small>Images, video, PDF, Word, Excel, PowerPoint</small>
          </button>

          {files.length > 0 && (
            <ul className="file-list">
              {files.map((file, index) => (
                <li key={`${file.name}-${file.size}`}>
                  <Icon name={fileIcon("pending", file.name)} size={18} />
                  <div>
                    <strong>{file.name}</strong>
                    <small>{formatSize(file.size)} · Ready</small>
                  </div>
                  <button
                    type="button"
                    aria-label={`Remove ${file.name}`}
                    onClick={() => setFiles(files.filter((_, item) => item !== index))}
                  >
                    <Icon name="close" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <label>
            Share with
            <span className="select">
              <Icon name="pin" size={16} />
              <select value={district} onChange={(event) => setDistrict(event.target.value)} aria-label="Share with district">
                {districtOptions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </span>
          </label>
        </div>
        <div className="panel-foot">
          <span className="foot-note">
            {files.length ? `${files.length} file${files.length === 1 ? "" : "s"} for ${district}` : "No files chosen"}
          </span>
          <button type="button" className="btn primary" disabled={!files.length || busy} onClick={() => void upload()}>
            <Icon name="upload" size={16} />
            {busy ? "Uploading…" : "Upload"}
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>Saved files</h2>
        </div>
        {groups.length === 0 ? (
          <p className="table-note">No files saved yet.</p>
        ) : (
          <ul className="folders">
            {groups.map((group) => (
              <li key={group.name}>
                <div className="folder-row">
                  <Icon name="folder" size={18} />
                  <strong>{group.name}</strong>
                  <span>{group.items.length}</span>
                </div>
                <ul>
                  {group.items.map((file) => (
                    <li key={file.id}>
                      <Icon name={fileIcon(file.kind, file.original_name)} size={16} />
                      <a href={`/api/admin/uploads/${file.id}`}>{file.original_name}</a>
                      <small>
                        {formatSize(Number(file.byte_size))} ·{" "}
                        {new Date(file.created_at).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </small>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
      <Toast message={notice} onClose={() => setNotice("")} />
    </>
  );
}
