import { z } from "zod";
import { COUNTRIES, TIMEZONES } from "@/config/app";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import { isValidSlug } from "@/lib/slug";

const countryCodes = COUNTRIES.map((c) => c.code) as [string, ...string[]];

export const workspaceProfileSchema = z.object({
  name: z.string().trim().min(2, "Use at least 2 characters").max(80),
  country: z.enum(countryCodes, "Choose a country"),
  baseCurrency: z.enum(SUPPORTED_CURRENCIES, "Choose a currency"),
  timezone: z.enum(TIMEZONES, "Choose a time zone"),
  fiscalYearStartMonth: z.coerce.number().int().min(1).max(12),
});

export const createWorkspaceSchema = workspaceProfileSchema.extend({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .refine(isValidSlug, "3–48 lowercase letters, numbers and dashes; some words are reserved"),
});

const minutes = z.coerce.number().int().min(0).max(24 * 60);

export const orgSettingsSchema = workspaceProfileSchema
  .extend({
    weekStartsOn: z.coerce.number().int().min(0).max(6),
    workingDays: z.array(z.coerce.number().int().min(0).max(6)).min(1, "Pick at least one working day").max(7),
    workdayStartMinutes: minutes,
    workdayEndMinutes: minutes,
  })
  .refine((v) => v.workdayEndMinutes > v.workdayStartMinutes, {
    path: ["workdayEndMinutes"],
    message: "End time must be after start time",
  });

export const inviteMemberSchema = z.object({
  email: z.email("Enter a valid email").transform((e) => e.toLowerCase().trim()),
  roleId: z.string().min(1, "Choose a role"),
});

export const changeRoleSchema = z.object({
  memberId: z.string().min(1),
  roleId: z.string().min(1),
});

export const memberIdSchema = z.object({ memberId: z.string().min(1) });
export const invitationIdSchema = z.object({ invitationId: z.string().min(1) });
