"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";

const titles: Record<string, string> = {
  "/": "Dashboard",
  "/notifications": "Notifications",
  "/documents": "Documents",
  "/members": "Members",
  "/districts": "Districts",
  "/meetings": "Meetings",
  "/reports": "Reports",
};

export function PortalShell({ children, username }: { children: ReactNode; username: string }) {
  const pathname = usePathname();
  const title = titles[pathname] ?? "PPCC Admin";

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <div className="app">
      <Sidebar username={username} />
      <div className="main">
        <header className="topbar">
          <nav className="crumb" aria-label="Breadcrumb">
            <Link href="/">Home</Link>
            {pathname !== "/" && (
              <>
                <span aria-hidden="true">/</span>
                <strong>{title}</strong>
              </>
            )}
          </nav>
          <div className="topbar-user">
            <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
            <div>
              {username}
              <small>PPCC Secretariat</small>
            </div>
            <button type="button" className="btn ghost topbar-logout" onClick={logout}>
              Log out
            </button>
          </div>
        </header>
        <div className="content">{children}</div>
      </div>
    </div>
  );
}
