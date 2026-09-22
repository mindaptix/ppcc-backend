"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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

  async function logout() {
    await fetch("/api/admin/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  return (
    <aside className="sidebar">
      <Link href="/" className="brand">
        <span className="brand-mark">P</span>
        <span>
          PPCC Admin
          <small>Punjab Congress</small>
        </span>
      </Link>
      <nav aria-label="Main">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={active ? "nav-link active" : "nav-link"}
              aria-current={active ? "page" : undefined}
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
