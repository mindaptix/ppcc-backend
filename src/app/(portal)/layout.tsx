import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { PortalShell } from "@/components/portal-shell";
import { getAdminSession } from "@/lib/admin-session";

export const dynamic = "force-dynamic";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect("/login");
  return <PortalShell username={session.username}>{children}</PortalShell>;
}
