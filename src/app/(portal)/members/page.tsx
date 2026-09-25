import { db } from "@/lib/db";
import { staticMembers } from "@/lib/static-portal";
import { AddMemberForm } from "@/components/add-member-form";

export const dynamic = "force-dynamic";
export const metadata = { title: "Members" };

export default async function MembersPage() {
  let saved: { mobile: string; created_at: Date | string }[] = [];
  try {
    const result = await db().query<{ mobile: string; created_at: Date }>(
      `SELECT mobile, created_at FROM members ORDER BY created_at DESC, mobile`,
    );
    saved = result.rows;
  } catch {
    saved = [];
  }
  const known = new Set(saved.map((member) => member.mobile));
  const members = [...staticMembers.filter((member) => !known.has(member.mobile)), ...saved];

  return (
    <>
      <div className="stack">
        <AddMemberForm />
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
                  <td data-label="Mobile">{member.mobile}</td>
                  <td data-label="Saved">
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
      </div>
    </>
  );
}
