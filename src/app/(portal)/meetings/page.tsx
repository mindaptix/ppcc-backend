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
                <td data-label="Meeting">{meeting.title}</td>
                <td data-label="When">{meeting.when}</td>
                <td data-label="Where">{meeting.place}</td>
                <td data-label="District">{meeting.district}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
