export const punjabDistricts = [
  "Amritsar",
  "Barnala",
  "Bathinda",
  "Faridkot",
  "Fatehgarh Sahib",
  "Fazilka",
  "Ferozepur",
  "Gurdaspur",
  "Hoshiarpur",
  "Jalandhar",
  "Kapurthala",
  "Ludhiana",
  "Malerkotla",
  "Mansa",
  "Moga",
  "Mohali (S.A.S. Nagar)",
  "Muktsar (Sri Muktsar Sahib)",
  "Nawanshahr (S.B.S. Nagar)",
  "Pathankot",
  "Patiala",
  "Rupnagar (Ropar)",
  "Sangrur",
  "Tarn Taran",
] as const;

export const districtOptions = ["All Punjab", ...punjabDistricts];

export const audiences = [
  "All members",
  "District presidents",
  "Block presidents",
  "Office bearers",
] as const;

export const channels = ["Push notification", "SMS", "Show in app"] as const;

const memberCounts: Record<(typeof punjabDistricts)[number], number> = {
  Amritsar: 2200,
  Barnala: 620,
  Bathinda: 1180,
  Faridkot: 540,
  "Fatehgarh Sahib": 610,
  Fazilka: 780,
  Ferozepur: 990,
  Gurdaspur: 1320,
  Hoshiarpur: 1210,
  Jalandhar: 1980,
  Kapurthala: 740,
  Ludhiana: 2800,
  Malerkotla: 480,
  Mansa: 690,
  Moga: 860,
  "Mohali (S.A.S. Nagar)": 1280,
  "Muktsar (Sri Muktsar Sahib)": 720,
  "Nawanshahr (S.B.S. Nagar)": 580,
  Pathankot: 710,
  Patiala: 1540,
  "Rupnagar (Ropar)": 640,
  Sangrur: 1190,
  "Tarn Taran": 872,
};

export const districtRows = punjabDistricts.map((name) => ({
  name,
  members: memberCounts[name],
  office: "Active",
}));

export const totalMembers = districtRows.reduce((sum, row) => sum + row.members, 0);

export const noticesSent = 1248;

export const notices = [
  { title: "District presidents meeting", district: "Ludhiana", date: "18 Sep 2026", status: "Sent" },
  { title: "Membership drive circular", district: "All Punjab", date: "12 Sep 2026", status: "Sent" },
  { title: "Block level review", district: "Amritsar", date: "9 Sep 2026", status: "Draft" },
  { title: "Booth committee list", district: "Patiala", date: "6 Sep 2026", status: "Sent" },
];

export const meetings = [
  { title: "District presidents review", when: "28 Sep 2026, 11:00 AM", place: "PPCC office, Chandigarh", district: "All Punjab" },
  { title: "Block committee meeting", when: "30 Sep 2026, 4:00 PM", place: "District office, Amritsar", district: "Amritsar" },
  { title: "Youth wing coordination", when: "2 Oct 2026, 10:30 AM", place: "District office, Ludhiana", district: "Ludhiana" },
];

export const officeFiles: { name: string; kind: "pdf" | "doc" | "image"; district: string; date: string }[] = [
  { name: "Membership_drive_circular.pdf", kind: "pdf", district: "All Punjab", date: "12 Sep 2026" },
  { name: "Block_review_notice.docx", kind: "doc", district: "Amritsar", date: "9 Sep 2026" },
  { name: "Rally_poster_ludhiana.png", kind: "image", district: "Ludhiana", date: "4 Sep 2026" },
  { name: "Booth_list_patiala.pdf", kind: "pdf", district: "Patiala", date: "6 Sep 2026" },
];

export const recentMembers = [
  { name: "Harpreet Kaur", role: "District president", district: "Ludhiana", updated: "18 Sep 2026" },
  { name: "Gurpreet Singh", role: "Block president", district: "Amritsar", updated: "17 Sep 2026" },
  { name: "Rajinder Kaur", role: "Office bearer", district: "Patiala", updated: "16 Sep 2026" },
  { name: "Manpreet Singh", role: "District president", district: "Jalandhar", updated: "15 Sep 2026" },
  { name: "Simranjeet Kaur", role: "Block president", district: "Bathinda", updated: "14 Sep 2026" },
  { name: "Harjinder Singh", role: "Office bearer", district: "Gurdaspur", updated: "12 Sep 2026" },
  { name: "Navjot Kaur", role: "District president", district: "Sangrur", updated: "11 Sep 2026" },
  { name: "Balwinder Singh", role: "Block president", district: "Ferozepur", updated: "9 Sep 2026" },
];

export const monthlyReports = [
  { month: "September 2026", notices: 41, documents: 9, meetings: 3 },
  { month: "August 2026", notices: 86, documents: 22, meetings: 7 },
  { month: "July 2026", notices: 74, documents: 18, meetings: 6 },
];
