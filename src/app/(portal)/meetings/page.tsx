import { PageIntro } from "@/components/page-intro";
import { meetings } from "@/lib/portal-data";

export const metadata = { title: "Meetings" };

export default function MeetingsPage() {
  return (
    <>
      <PageIntro title="Meetings" text="What is on the secretariat calendar." />
      <section className="panel table-panel">
        <table className="data">
          <thead>
            <tr>
              <th>Meeting</th>
              <th>When</th>
              <th>Where</th>
              <th>District</th>
            </tr>
          </thead>
          <tbody>
            {meetings.map((meeting) => (
              <tr key={meeting.title}>
                <td>{meeting.title}</td>
                <td>{meeting.when}</td>
                <td>{meeting.place}</td>
                <td>{meeting.district}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
