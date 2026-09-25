export const staticMembers = [
  { mobile: "7018319344", created_at: "2026-09-25T00:00:00.000Z" },
  { mobile: "8376932843", created_at: "2026-09-25T00:00:00.000Z" },
  { mobile: "7591033165", created_at: "2026-09-25T00:00:00.000Z" },
  { mobile: "8264968199", created_at: "2026-09-25T00:00:00.000Z" },
] as const;

export const staticNotices = [
  {
    id: "static-ppcc-welcome",
    title: "PPCC portal notice",
    body: "Your number is registered on the PPCC portal. Notices for registered members will appear here.",
    district: "All Punjab",
    date: "25 Sep 2026",
    status: "Sent" as const,
    mobiles: staticMembers.map((member) => member.mobile),
  },
];
