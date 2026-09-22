import { db } from "@/lib/db";
import { PageIntro } from "@/components/page-intro";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };

export default async function MembersPage() {
  const result = await db().query<{ mobile: string; created_at: Date }>(
    `SELECT mobile, created_at FROM members ORDER BY created_at DESC, mobile`,
  );
  const members = result.rows;

  return (
    <>
      <PageIntro
        title="Members"
        text="Only these mobile numbers can sign in to the app. The member enters the number, receives an OTP, and then opens the app."
      />
      <section className="panel table-panel">
        <div className="panel-head">
          <h2>App login numbers</h2>
        </div>
        <table className="data">
          <thead>
            <tr>
              <th>Mobile</th>
              <th>Saved</th>
            </tr>
          </thead>
          <tbody>
            {members.length === 0 ? (
              <tr>
                <td colSpan={2} className="empty">
                  No numbers saved yet.
                </td>
              </tr>
            ) : (
              members.map((member) => (
                <tr key={member.mobile}>
                  <td>{member.mobile}</td>
                  <td>
                    {new Date(member.created_at).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <p className="table-note">
          {members.length} {members.length === 1 ? "number" : "numbers"}
        </p>
      </section>
    </>
  );
}
