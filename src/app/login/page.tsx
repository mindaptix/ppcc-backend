import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/");

  return (
    <main className="login-screen">
      <LoginForm />
    </main>
  );
}
