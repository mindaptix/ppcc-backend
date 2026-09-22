import Link from "next/link";
import { PageIntro } from "@/components/page-intro";
import { Icon } from "@/components/icon";
import { districtRows, meetings, notices, noticesSent, totalMembers } from "@/lib/portal-data";

export const metadata = { title: "Dashboard" };

export default function DashboardPage() {
  const stats = [
    { icon: "users" as const, label: "Members", value: totalMembers.toLocaleString("en-IN"), note: "On the rolls" },
    { icon: "pin" as const, label: "Districts", value: String(districtRows.length), note: "All Punjab" },
    { icon: "bell" as const, label: "Notices sent", value: noticesSent.toLocaleString("en-IN"), note: "Last 30 days" },
    { icon: "calendar" as const, label: "Meetings", value: String(meetings.length), note: "Coming up" },
  ];

  return (
    <>
      <PageIntro
        title="Dashboard"
        text="Notices, files, and district work."
        action={
          <Link href="/notifications" className="btn primary">
            <Icon name="bell" size={16} />
            New notification
          </Link>
        }
      />
      <section className="stats">
        {stats.map((stat) => (
          <article key={stat.label} className="stat">
            <span className="icon-tile">
              <Icon name={stat.icon} />
            </span>
            <div>
              <p>{stat.label}</p>
              <strong>{stat.value}</strong>
              <small>{stat.note}</small>
            </div>
          </article>
        ))}
      </section>
      <div className="split-panels">
        <section className="panel table-panel">
          <div className="panel-head split">
            <h2>Recent notices</h2>
            <Link href="/notifications">Open</Link>
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
        <section className="panel table-panel">
          <div className="panel-head split">
            <h2>Upcoming meetings</h2>
            <Link href="/meetings">Open</Link>
          </div>
          <ul className="meeting-list">
            {meetings.map((meeting) => (
              <li key={meeting.title}>
                <strong>{meeting.title}</strong>
                <span>{meeting.when}</span>
                <small>{meeting.place}</small>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
