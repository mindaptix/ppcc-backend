import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin-session";
import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sign in" };

export default async function LoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/");

  return (
    <main className="grid min-h-dvh place-items-center bg-[#f3f5f7] px-4 py-[max(1.25rem,env(safe-area-inset-top))] pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:px-5">
      <div className="grid w-full max-w-[960px] overflow-hidden rounded-lg border border-[#d7dee6] bg-white shadow-[0_16px_40px_rgba(23,32,51,0.08)] md:grid-cols-[1.08fr_0.92fr]">
        <section className="bg-[#0c3d24] bg-[linear-gradient(90deg,#ff671f_0_8px,transparent_8px)] px-5 py-6 text-white sm:px-7 md:flex md:min-h-[460px] md:flex-col md:justify-start md:px-9 md:py-10">
          <p className="mb-2 text-xs font-bold tracking-[0.08em] text-[#ffb087] uppercase">Official portal</p>
          <h1 className="text-[1.65rem] leading-tight font-semibold sm:text-[2.1rem]">
            Punjab Pradesh
            <br />
            Congress Committee
          </h1>
          <p className="mt-3 hidden max-w-[34ch] text-[15px] text-[#d7e7dc] md:block">
            Administration desk for district offices, meetings, documents, and member records.
          </p>
          <ul className="mt-7 hidden list-none space-y-2 p-0 md:grid">
            <li className="text-sm before:mr-2 before:inline-block before:size-2 before:rounded-full before:bg-[#ff671f] before:content-['']">
              Authorised office staff only
            </li>
            <li className="text-sm before:mr-2 before:inline-block before:size-2 before:rounded-full before:bg-[#ff671f] before:content-['']">
              Secure access for committee records
            </li>
          </ul>
        </section>
        <LoginForm />
      </div>
    </main>
  );
}
