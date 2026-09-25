import { NotificationForm } from "@/components/notification-form";
import { PageIntro } from "@/components/page-intro";
import { notices } from "@/lib/portal-data";
import { staticNotices } from "@/lib/static-portal";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <PageIntro title="Notifications" text="Write a notice and choose who should get it." />
      <div className="stack">
        <NotificationForm />
        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Portal message</h2>
          </div>
          <table className="data">
            <thead>
              <tr>
                <th>Title</th>
                <th>District</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {staticNotices.map((notice) => (
                <tr key={notice.id}>
                  <td data-label="Title">{notice.title}</td>
                  <td data-label="District">{notice.district}</td>
                  <td data-label="Date">{notice.date}</td>
                  <td data-label="Status">
                    <span className="status sent">{notice.status}</span>
                  </td>
                </tr>
              ))}
              {notices.map((notice) => (
                <tr key={notice.title}>
                  <td data-label="Title">{notice.title}</td>
                  <td data-label="District">{notice.district}</td>
                  <td data-label="Date">{notice.date}</td>
                  <td data-label="Status">
                    <span className={notice.status === "Sent" ? "status sent" : "status draft"}>{notice.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>
    </>
  );
}
