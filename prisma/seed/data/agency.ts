import type { SystemRoleKey } from "../../../src/server/rbac/catalog";

export const DEMO_PASSWORD = "Northlight@2026";
export const DEMO_DOMAIN = "northlight.studio";

export const AGENCY = {
  name: "Northlight Studio",
  slug: "northlight",
  country: "IN",
  baseCurrency: "INR",
  timezone: "Asia/Kolkata",
  fiscalYearStartMonth: 4,
} as const;

export const LOCATIONS = [
  { code: "BLR", name: "Bengaluru HQ", country: "IN", city: "Bengaluru", timezone: "Asia/Kolkata", currency: "INR", isHeadOffice: true },
  { code: "LON", name: "London Studio", country: "GB", city: "London", timezone: "Europe/London", currency: "GBP", isHeadOffice: false },
  { code: "DXB", name: "Dubai Office", country: "AE", city: "Dubai", timezone: "Asia/Dubai", currency: "AED", isHeadOffice: false },
] as const;
export type LocationCode = (typeof LOCATIONS)[number]["code"];

export const DEPARTMENTS = [
  { code: "LEAD", name: "Leadership" },
  { code: "PEOPLE", name: "People Operations" },
  { code: "FIN", name: "Finance" },
  { code: "GROWTH", name: "Growth & Partnerships" },
  { code: "CS", name: "Client Services" },
  { code: "DESIGN", name: "Design" },
  { code: "TECH", name: "Technology" },
  { code: "STRAT", name: "Strategy & Content" },
] as const;
export type DepartmentCode = (typeof DEPARTMENTS)[number]["code"];

export const GRADES = [
  { code: "L1", name: "Executive", rank: 7 },
  { code: "L2", name: "Director", rank: 6 },
  { code: "L3", name: "Lead / Manager", rank: 5 },
  { code: "L4", name: "Senior", rank: 4 },
  { code: "L5", name: "Mid-level", rank: 3 },
  { code: "L6", name: "Junior", rank: 2 },
  { code: "L7", name: "Intern", rank: 1 },
] as const;
export type GradeCode = (typeof GRADES)[number]["code"];

export interface SeedPerson {
  key: string;
  name: string;
  title: string;
  role: SystemRoleKey;
  department: DepartmentCode | null;
  location: LocationCode | null;
  grade: GradeCode | null;
  manager: string | null;
  joined: string;
  email?: string;
}

/** 20 employees + 1 client guest. `manager` references another person's `key`. */
export const PEOPLE: SeedPerson[] = [
  { key: "aarav", name: "Aarav Mehta", title: "Founder & CEO", role: "owner", department: "LEAD", location: "BLR", grade: "L1", manager: null, joined: "2018-06-01" },
  { key: "sofia", name: "Sofia Grant", title: "Chief Operating Officer", role: "admin", department: "LEAD", location: "LON", grade: "L1", manager: "aarav", joined: "2019-02-11" },
  { key: "meera", name: "Meera Iyer", title: "Head of People", role: "hr_manager", department: "PEOPLE", location: "BLR", grade: "L2", manager: "sofia", joined: "2019-09-02" },
  { key: "kavya", name: "Kavya Reddy", title: "People Operations Executive", role: "employee", department: "PEOPLE", location: "BLR", grade: "L5", manager: "meera", joined: "2023-04-17" },
  { key: "rohan", name: "Rohan Kapoor", title: "Finance Controller", role: "finance_manager", department: "FIN", location: "BLR", grade: "L2", manager: "aarav", joined: "2020-01-06" },
  { key: "fatima", name: "Fatima Al Mansouri", title: "Accounts Executive", role: "employee", department: "FIN", location: "DXB", grade: "L5", manager: "rohan", joined: "2022-08-01" },
  { key: "james", name: "James Whitfield", title: "Head of Growth", role: "sales_manager", department: "GROWTH", location: "LON", grade: "L2", manager: "sofia", joined: "2020-05-18" },
  { key: "omar", name: "Omar Haddad", title: "Business Development Manager, GCC", role: "sales_manager", department: "GROWTH", location: "DXB", grade: "L3", manager: "james", joined: "2021-11-08" },
  { key: "priya", name: "Priya Nair", title: "Head of Delivery", role: "project_manager", department: "CS", location: "BLR", grade: "L2", manager: "sofia", joined: "2019-07-15" },
  { key: "daniel", name: "Daniel Okafor", title: "Senior Project Manager", role: "project_manager", department: "CS", location: "LON", grade: "L3", manager: "priya", joined: "2021-03-01" },
  { key: "ananya", name: "Ananya Gupta", title: "Account Manager", role: "employee", department: "CS", location: "BLR", grade: "L4", manager: "priya", joined: "2022-01-10" },
  { key: "lucas", name: "Lucas Moreau", title: "Creative Director", role: "team_lead", department: "DESIGN", location: "LON", grade: "L2", manager: "aarav", joined: "2019-04-08" },
  { key: "ishaan", name: "Ishaan Verma", title: "Senior Visual Designer", role: "employee", department: "DESIGN", location: "BLR", grade: "L4", manager: "lucas", joined: "2020-10-12" },
  { key: "zara", name: "Zara Sheikh", title: "UI/UX Designer", role: "employee", department: "DESIGN", location: "DXB", grade: "L5", manager: "lucas", joined: "2023-02-06" },
  { key: "nikhil", name: "Nikhil Joshi", title: "Motion Designer", role: "employee", department: "DESIGN", location: "BLR", grade: "L5", manager: "lucas", joined: "2022-06-20" },
  { key: "emily", name: "Emily Clarke", title: "Design Intern", role: "employee", department: "DESIGN", location: "LON", grade: "L7", manager: "lucas", joined: "2026-06-01" },
  { key: "arjun", name: "Arjun Pillai", title: "Technology Lead", role: "team_lead", department: "TECH", location: "BLR", grade: "L3", manager: "priya", joined: "2020-08-03" },
  { key: "sneha", name: "Sneha Kulkarni", title: "Frontend Developer", role: "employee", department: "TECH", location: "BLR", grade: "L5", manager: "arjun", joined: "2022-09-05" },
  { key: "rahul", name: "Rahul Desai", title: "Full-stack Developer", role: "employee", department: "TECH", location: "BLR", grade: "L4", manager: "arjun", joined: "2021-07-19" },
  { key: "chloe", name: "Chloe Bennett", title: "Brand Strategist", role: "employee", department: "STRAT", location: "LON", grade: "L4", manager: "lucas", joined: "2021-12-06" },
  { key: "liam", name: "Liam Carter", title: "Marketing Director, Harbourline Coffee", role: "guest", department: null, location: null, grade: null, manager: null, joined: "2026-02-02", email: "liam@harbourline.com.au" },
];

export function personEmail(p: SeedPerson): string {
  return p.email ?? `${p.key}@${DEMO_DOMAIN}`;
}
