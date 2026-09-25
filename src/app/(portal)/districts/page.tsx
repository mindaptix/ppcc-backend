import { PageIntro } from "@/components/page-intro";
import { districtRows, totalMembers } from "@/lib/portal-data";

export const metadata = { title: "Districts" };

export default function DistrictsPage() {
  return (
    <>
      <PageIntro title="Districts" text={`${districtRows.length} districts · ${totalMembers.toLocaleString("en-IN")} members on the rolls.`} />
      <section className="panel table-panel">
        <table className="data">
          <thead>
            <tr>
              <th>District</th>
              <th>Members</th>
              <th>Office</th>
            </tr>
          </thead>
          <tbody>
            {districtRows.map((row) => (
              <tr key={row.name}>
                <td data-label="District">{row.name}</td>
                <td data-label="Members">{row.members.toLocaleString("en-IN")}</td>
                <td data-label="Office">
                  <span className={row.office === "Active" ? "status sent" : "status draft"}>{row.office}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
