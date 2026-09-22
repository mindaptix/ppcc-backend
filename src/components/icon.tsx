import type { ReactNode } from "react";

export type IconName =
  | "home"
  | "bell"
  | "users"
  | "pin"
  | "file"
  | "calendar"
  | "chart"
  | "upload"
  | "image"
  | "send"
  | "close"
  | "eye"
  | "eyeOff"
  | "save"
  | "search"
  | "folder"
  | "video";

const paths: Record<IconName, ReactNode> = {
  home: (
    <>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z" />
    </>
  ),
  bell: (
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </>
  ),
  users: (
    <>
      <circle cx="9" cy="8" r="3" />
      <path d="M3.5 19v-1.2A4.8 4.8 0 0 1 8.3 13h1.4A4.8 4.8 0 0 1 14.5 17.8V19" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M16.2 13.2A3.8 3.8 0 0 1 20.5 17v2" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21s7-6.1 7-11a7 7 0 1 0-14 0c0 4.9 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.2" />
    </>
  ),
  file: (
    <>
      <path d="M7 3h7l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.5" y="5" width="17" height="15.5" rx="1.5" />
      <path d="M8 3.5V7M16 3.5V7M3.5 10.5h17" />
    </>
  ),
  chart: (
    <>
      <path d="M4 19V5M4 19h16" />
      <path d="M8 16v-4M12 16V8M16 16v-6" />
    </>
  ),
  upload: (
    <>
      <path d="M12 16V5" />
      <path d="m7.5 9 4.5-4.5L16.5 9" />
      <path d="M5 19h14" />
    </>
  ),
  image: (
    <>
      <rect x="3.5" y="4.5" width="17" height="15" rx="1.5" />
      <circle cx="8.5" cy="9" r="1.3" />
      <path d="m4 16.5 4.2-3.6 3.2 2.6 2.4-2.8L20 16.8" />
    </>
  ),
  send: (
    <>
      <path d="M4 12h11" />
      <path d="m11 7 5 5-5 5" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.4" />
    </>
  ),
  eyeOff: (
    <>
      <path d="M4 5.5 19 19" />
      <path d="M9.5 9.8A3.2 3.2 0 0 0 14.2 14.5" />
      <path d="M6.2 7.4C4.2 8.8 2.5 12 2.5 12S6 17.5 12 17.5c1.5 0 2.8-.4 4-.9" />
      <path d="M10 6.7A9 9 0 0 1 12 6.5C18 6.5 21.5 12 21.5 12s-.8 1.3-2.2 2.6" />
    </>
  ),
  save: (
    <>
      <path d="M5 3.5h11.2L20.5 8v12.5H5V3.5Z" />
      <path d="M8 3.5V8h7V3.5M8 20.5v-6h8v6" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6" />
      <path d="m15.5 15.5 4 4" />
    </>
  ),
  folder: (
    <>
      <path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h4l2 2h8a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 20H5a1.5 1.5 0 0 1-1.5-1.5v-11Z" />
    </>
  ),
  video: (
    <>
      <rect x="3.5" y="6" width="12" height="12" rx="1.5" />
      <path d="m15.5 10 5-2.5v9L15.5 14" />
    </>
  ),
};

export function Icon({ name, size = 18 }: { name: IconName; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
