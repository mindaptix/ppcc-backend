"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Icon, type IconName } from "./icon";

const links: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Dashboard", icon: "home" },
  { href: "/notifications", label: "Notifications", icon: "bell" },
  { href: "/documents", label: "Documents", icon: "folder" },
  { href: "/members", label: "Members", icon: "users" },
  { href: "/districts", label: "Districts", icon: "pin" },
  { href: "/meetings", label: "Meetings", icon: "calendar" },
  { href: "/reports", label: "Reports", icon: "chart" },
];

export function Sidebar({ username }: { username: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className={open ? "sidebar open" : "sidebar"}>
      <div className="sidebar-bar">
        <Link href="/" className="brand">
          <span className="brand-mark">P</span>
          <span>
            PPCC Admin
            <small>Punjab Congress</small>
          </span>
        </Link>
        <button
          type="button"
          className="menu-toggle"
          aria-expanded={open}
          aria-controls="portal-nav"
          onClick={() => setOpen((current) => !current)}
        >
          <Icon name={open ? "close" : "menu"} size={22} />
          <span className="visually-hidden">{open ? "Close menu" : "Open menu"}</span>
        </button>
      </div>
      {open && (
        <button type="button" className="nav-backdrop" aria-label="Close menu" onClick={() => setOpen(false)} />
      )}
      <nav id="portal-nav" aria-label="Main">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "nav-link active" : "nav-link"}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon name={link.icon} />
              {link.label}
            </Link>
          );
        })}
      </nav>
      <div className="sidebar-user">
        <span className="avatar">{username.slice(0, 2).toUpperCase()}</span>
        <div>
          {username}
          <small>Secretariat</small>
        </div>
        <button type="button" className="logout" onClick={logout}>
          Log out
        </button>
      </div>
    </aside>
  );
}
