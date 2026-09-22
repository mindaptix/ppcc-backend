export const imageMaxBytes = 20 * 1024 * 1024;
export const documentMaxBytes = 30 * 1024 * 1024;
export const videoMaxBytes = 200 * 1024 * 1024;

export type UploadKind = "image" | "video" | "document";

const rules: Record<string, { kind: UploadKind; max: number }> = {
  jpg: { kind: "image", max: imageMaxBytes },
  jpeg: { kind: "image", max: imageMaxBytes },
  png: { kind: "image", max: imageMaxBytes },
  gif: { kind: "image", max: imageMaxBytes },
  webp: { kind: "image", max: imageMaxBytes },
  heic: { kind: "image", max: imageMaxBytes },
  heif: { kind: "image", max: imageMaxBytes },
  mp4: { kind: "video", max: videoMaxBytes },
  webm: { kind: "video", max: videoMaxBytes },
  mov: { kind: "video", max: videoMaxBytes },
  pdf: { kind: "document", max: documentMaxBytes },
  doc: { kind: "document", max: documentMaxBytes },
  docx: { kind: "document", max: documentMaxBytes },
  ppt: { kind: "document", max: documentMaxBytes },
  pptx: { kind: "document", max: documentMaxBytes },
  xls: { kind: "document", max: documentMaxBytes },
  xlsx: { kind: "document", max: documentMaxBytes },
};

export const acceptAttribute = Object.keys(rules)
  .map((ext) => `.${ext}`)
  .join(",");

export function extensionOf(name: string) {
  const base = name.split(/[/\\]/).pop() ?? "";
  return /\.([a-z0-9]{1,8})$/i.exec(base)?.[1].toLowerCase() ?? "";
}

export function displayName(name: string) {
  const base = (name.split(/[/\\]/).pop() ?? "file").replace(/[\u0000-\u001f]/g, "");
  const cleaned = base.replace(/[^\w.\- ()[\]]+/g, "_").slice(0, 180);
  return cleaned || "file";
}

export function clientFileError(name: string, size: number) {
  const rule = rules[extensionOf(name)];
  if (!rule) return `${name} is not allowed. Use an image, video, PDF, Word, Excel, or PowerPoint file.`;
  if (!size) return `${name} is empty.`;
  if (size > rule.max) return `${name} is over ${Math.round(rule.max / (1024 * 1024))} MB.`;
  return "";
}

export function maxBytesForKind(kind: UploadKind) {
  if (kind === "video") return videoMaxBytes;
  if (kind === "image") return imageMaxBytes;
  return documentMaxBytes;
}
