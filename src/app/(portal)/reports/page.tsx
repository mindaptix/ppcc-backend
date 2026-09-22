import { PageIntro } from "@/components/page-intro";
import { monthlyReports } from "@/lib/portal-data";

export const metadata = { title: "Reports" };

export default function ReportsPage() {
  return (
    <>
      <PageIntro title="Reports" text="Counts from the last three months." />
      <section className="panel table-panel">
        <table className="data">
          <thead>
            <tr>
              <th>Month</th>
              <th>Notices</th>
              <th>Documents</th>
              <th>Meetings</th>
            </tr>
          </thead>
          <tbody>
            {monthlyReports.map((row) => (
              <tr key={row.month}>
                <td>{row.month}</td>
                <td>{row.notices}</td>
                <td>{row.documents}</td>
                <td>{row.meetings}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
