export const APP_NAME = "OpsHub";
export const APP_TAGLINE = "Projects, clients, people and money — in one workspace.";

export const COOKIE_LAST_ORG = "opshub-last-org";
export const COOKIE_SIDEBAR = "opshub-sidebar";
export const COOKIE_DENSITY = "opshub-density";

export type Density = "comfortable" | "compact";

export const COUNTRIES = [
  { code: "IN", name: "India", currency: "INR", timezone: "Asia/Kolkata", fyStart: 4 },
  { code: "US", name: "United States", currency: "USD", timezone: "America/New_York", fyStart: 1 },
  { code: "GB", name: "United Kingdom", currency: "GBP", timezone: "Europe/London", fyStart: 4 },
  { code: "AU", name: "Australia", currency: "AUD", timezone: "Australia/Sydney", fyStart: 7 },
  { code: "AE", name: "United Arab Emirates", currency: "AED", timezone: "Asia/Dubai", fyStart: 1 },
  { code: "SA", name: "Saudi Arabia", currency: "SAR", timezone: "Asia/Riyadh", fyStart: 1 },
  { code: "QA", name: "Qatar", currency: "QAR", timezone: "Asia/Qatar", fyStart: 1 },
  { code: "SG", name: "Singapore", currency: "SGD", timezone: "Asia/Singapore", fyStart: 4 },
  { code: "CA", name: "Canada", currency: "CAD", timezone: "America/Toronto", fyStart: 1 },
] as const;

export const TIMEZONES = [
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Riyadh",
  "Asia/Qatar",
  "Asia/Singapore",
  "Europe/London",
  "Europe/Berlin",
  "America/New_York",
  "America/Chicago",
  "America/Los_Angeles",
  "America/Toronto",
  "Australia/Sydney",
  "Australia/Melbourne",
  "UTC",
] as const;

export const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
