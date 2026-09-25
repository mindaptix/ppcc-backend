"use client";

import { useState } from "react";
import { recentMembers } from "@/lib/portal-data";
import { Icon } from "./icon";

export function MembersDirectory() {
  const [query, setQuery] = useState("");
  const term = query.trim().toLowerCase();
  const rows = recentMembers.filter((member) =>
    `${member.name} ${member.role} ${member.district}`.toLowerCase().includes(term),
  );

  return (
    <section className="panel table-panel">
      <div className="panel-head split">
        <h2>Latest updates</h2>
        <label className="search">
          <Icon name="search" size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search name, role, or district"
            aria-label="Search members"
          />
        </label>
      </div>
      <table className="data">
        <thead>
          <tr>
            <th>Name</th>
            <th>Role</th>
            <th>District</th>
            <th>Updated</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={4} className="empty">
                No matching members.
              </td>
            </tr>
          ) : (
            rows.map((member) => (
              <tr key={`${member.name}-${member.district}`}>
                <td data-label="Name">{member.name}</td>
                <td data-label="Role">{member.role}</td>
                <td data-label="District">{member.district}</td>
                <td data-label="Updated">{member.updated}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      <p className="table-note">
        {rows.length} {rows.length === 1 ? "record" : "records"}
      </p>
    </section>
  );
}
