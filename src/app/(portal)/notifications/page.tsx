import { NotificationForm } from "@/components/notification-form";
import { PageIntro } from "@/components/page-intro";
import { notices } from "@/lib/portal-data";

export const metadata = { title: "Notifications" };

export default function NotificationsPage() {
  return (
    <>
      <PageIntro title="Notifications" text="Write a notice and choose who should get it." />
      <div className="stack">
        <NotificationForm />
        <section className="panel table-panel">
          <div className="panel-head">
            <h2>Example notifications — sample data</h2>
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
              {notices.map((notice) => (
                <tr key={notice.title}>
                  <td>{notice.title}</td>
                  <td>{notice.district}</td>
                  <td>{notice.date}</td>
                  <td>
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
