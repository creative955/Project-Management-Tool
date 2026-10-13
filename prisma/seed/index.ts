import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { createOrganization } from "../../src/server/modules/org/bootstrap";
import type { SystemRoleKey } from "../../src/server/rbac/catalog";
import {
  AGENCY,
  DEMO_PASSWORD,
  DEPARTMENTS,
  GRADES,
  LOCATIONS,
  PEOPLE,
  personEmail,
} from "./data/agency";
import { CLIENTS } from "./data/clients";

const prisma = new PrismaClient();

const SISTER_ORG = {
  name: "Northlight Ventures",
  slug: "northlight-ventures",
  country: "AE",
  baseCurrency: "AED",
  timezone: "Asia/Dubai",
  fiscalYearStartMonth: 1,
} as const;

async function upsertUsers(passwordHash: string) {
  const ids = new Map<string, string>();
  for (const p of PEOPLE) {
    const email = personEmail(p);
    const user = await prisma.user.upsert({
      where: { email },
      update: { name: p.name, passwordHash, deletedAt: null },
      create: { email, name: p.name, passwordHash, emailVerified: new Date() },
    });
    ids.set(p.key, user.id);
  }
  return ids;
}

async function seedAgency(userIds: Map<string, string>) {
  const ownerId = userIds.get("aarav")!;

  await prisma.$transaction(
    async (tx) => {
      const { org, roles, ownerMemberId } = await createOrganization(tx, { ...AGENCY, ownerUserId: ownerId });
      const base = { orgId: org.id, createdById: ownerId };

      const locations = new Map<string, string>();
      for (const l of LOCATIONS) {
        const row = await tx.location.create({ data: { ...base, ...l } });
        locations.set(l.code, row.id);
      }
      const departments = new Map<string, string>();
      for (const d of DEPARTMENTS) {
        const row = await tx.department.create({ data: { ...base, ...d } });
        departments.set(d.code, row.id);
      }
      const grades = new Map<string, string>();
      for (const g of GRADES) {
        const row = await tx.grade.create({ data: { ...base, ...g } });
        grades.set(g.code, row.id);
      }
      const designations = new Map<string, string>();
      for (const title of new Set(PEOPLE.filter((p) => p.role !== "guest").map((p) => p.title))) {
        const row = await tx.designation.create({ data: { ...base, name: title } });
        designations.set(title, row.id);
      }

      const memberIds = new Map<string, string>();
      for (const p of PEOPLE) {
        const data = {
          roleId: roles[p.role as SystemRoleKey].id,
          title: p.title,
          departmentId: p.department ? departments.get(p.department)! : null,
          locationId: p.location ? locations.get(p.location)! : null,
          gradeId: p.grade ? grades.get(p.grade)! : null,
          designationId: designations.get(p.title) ?? null,
          joinedAt: new Date(`${p.joined}T09:00:00Z`),
        };
        if (p.key === "aarav") {
          await tx.member.update({ where: { id: ownerMemberId }, data });
          memberIds.set(p.key, ownerMemberId);
        } else {
          const m = await tx.member.create({ data: { ...base, userId: userIds.get(p.key)!, ...data } });
          memberIds.set(p.key, m.id);
        }
      }
      for (const p of PEOPLE) {
        if (!p.manager) continue;
        await tx.member.update({
          where: { id: memberIds.get(p.key)! },
          data: { managerId: memberIds.get(p.manager)! },
        });
      }

      await tx.invitation.create({
        data: {
          ...base,
          email: "hiring.designer@example.com",
          roleId: roles.employee.id,
          tokenHash: "seed-placeholder-invitation-not-redeemable",
          expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        },
      });

      await tx.auditLog.create({
        data: {
          orgId: org.id,
          actorId: null,
          action: "seed.completed",
          entityType: "Organization",
          entityId: org.id,
          metadata: { members: PEOPLE.length, clientsQueuedForPhase5: CLIENTS.length },
        },
      });
    },
    { timeout: 60_000 },
  );
}

async function seedSisterOrg(userIds: Map<string, string>) {
  const ownerId = userIds.get("aarav")!;
  await prisma.$transaction(async (tx) => {
    const { org, roles } = await createOrganization(tx, { ...SISTER_ORG, ownerUserId: ownerId });
    const location = await tx.location.create({
      data: { orgId: org.id, createdById: ownerId, code: "DXB", name: "Dubai", country: "AE", city: "Dubai", timezone: "Asia/Dubai", currency: "AED", isHeadOffice: true },
    });
    for (const [key, role] of [
      ["sofia", "admin"],
      ["omar", "sales_manager"],
      ["fatima", "finance_manager"],
    ] as const) {
      await tx.member.create({
        data: { orgId: org.id, createdById: ownerId, userId: userIds.get(key)!, roleId: roles[role].id, locationId: location.id },
      });
    }
  });
}

async function main() {
  console.log("Seeding demo data…");
  await prisma.organization.deleteMany({ where: { slug: { in: [AGENCY.slug, SISTER_ORG.slug] } } });

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const userIds = await upsertUsers(passwordHash);
  await seedAgency(userIds);
  await seedSisterOrg(userIds);

  console.log(`✔ ${AGENCY.name}: ${PEOPLE.length - 1} employees + 1 client guest, ${LOCATIONS.length} locations, ${DEPARTMENTS.length} departments`);
  console.log(`✔ ${SISTER_ORG.name}: 4 members (workspace switcher / tenant isolation demo)`);
  console.log(`  Sign in with any @northlight.studio address, password ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
