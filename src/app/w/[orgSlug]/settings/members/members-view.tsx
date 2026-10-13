"use client";

import { MoreHorizontal, Search, ShieldCheck, UserCheck, UserX, Users, X } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { EmptyState } from "@/components/common/states";
import { UserAvatar } from "@/components/common/user-avatar";
import { ViewsBar } from "@/components/shell/views-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { changeMemberRole, restoreMember, revokeInvitation, suspendMember } from "@/server/modules/org/actions";
import { InviteDialog } from "./invite-dialog";

export interface MemberRow {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  title: string | null;
  status: "ACTIVE" | "SUSPENDED";
  roleId: string;
  roleName: string;
  roleKey: string;
  department: string | null;
  location: string | null;
  manager: string | null;
  joinedAt: string;
}

export interface InvitationRow {
  id: string;
  email: string;
  roleName: string;
  expiresAt: string;
  expired: boolean;
}

interface Permissions {
  canInvite: boolean;
  canEdit: boolean;
  canSuspend: boolean;
  isOwner: boolean;
}

type StatusFilter = "ACTIVE" | "SUSPENDED" | "ALL";

const dateFmt = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric" });

function MemberActions({
  member,
  roles,
  perms,
  currentMemberId,
  onChangeRole,
  onSuspend,
  onRestore,
}: {
  member: MemberRow;
  roles: { id: string; name: string; key: string }[];
  perms: Permissions;
  currentMemberId: string;
  onChangeRole(member: MemberRow, roleId: string): void;
  onSuspend(member: MemberRow): void;
  onRestore(member: MemberRow): void;
}) {
  const isSelf = member.id === currentMemberId;
  const ownerLocked = member.roleKey === "owner" && !perms.isOwner;
  const assignable = roles.filter((r) => r.key !== "owner" || perms.isOwner);
  if (!perms.canEdit && !perms.canSuspend) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${member.name ?? member.email}`}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="truncate text-xs text-muted-foreground">{member.email}</DropdownMenuLabel>
        {perms.canEdit && member.status === "ACTIVE" ? (
          <DropdownMenuSub>
            <DropdownMenuSubTrigger disabled={ownerLocked}>
              <ShieldCheck /> Change role
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuRadioGroup value={member.roleId} onValueChange={(roleId) => onChangeRole(member, roleId)}>
                {assignable.map((r) => (
                  <DropdownMenuRadioItem key={r.id} value={r.id}>
                    {r.name}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        ) : null}
        <DropdownMenuSeparator />
        {member.status === "ACTIVE" ? (
          perms.canSuspend ? (
            <DropdownMenuItem variant="destructive" disabled={isSelf || ownerLocked} onSelect={() => onSuspend(member)}>
              <UserX /> Suspend access
            </DropdownMenuItem>
          ) : null
        ) : perms.canEdit ? (
          <DropdownMenuItem onSelect={() => onRestore(member)}>
            <UserCheck /> Restore access
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function StatusBadge({ status }: { status: MemberRow["status"] }) {
  return status === "ACTIVE" ? (
    <Badge variant="secondary">Active</Badge>
  ) : (
    <Badge variant="outline" className="border-destructive/40 text-destructive">
      Suspended
    </Badge>
  );
}

export function MembersView({
  orgSlug,
  currentMemberId,
  members,
  invitations,
  roles,
  perms,
  initialQuery,
  openInvite,
}: {
  orgSlug: string;
  currentMemberId: string;
  members: MemberRow[];
  invitations: InvitationRow[];
  roles: { id: string; name: string; key: string }[];
  perms: Permissions;
  initialQuery: string;
  openInvite: boolean;
}) {
  const [view, setView] = useState<"table" | "cards">("table");
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<StatusFilter>("ACTIVE");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (status !== "ALL" && m.status !== status) return false;
      if (!q) return true;
      return [m.name, m.email, m.title, m.department, m.roleName, m.location]
        .filter(Boolean)
        .some((v) => v!.toLowerCase().includes(q));
    });
  }, [members, query, status]);

  const counts = useMemo(
    () => ({
      ACTIVE: members.filter((m) => m.status === "ACTIVE").length,
      SUSPENDED: members.filter((m) => m.status === "SUSPENDED").length,
      ALL: members.length,
    }),
    [members],
  );

  function handleChangeRole(member: MemberRow, roleId: string) {
    startTransition(async () => {
      const result = await changeMemberRole(orgSlug, { memberId: member.id, roleId });
      if (result.ok) toast.success(`${member.name ?? member.email} is now ${roles.find((r) => r.id === roleId)?.name}`);
      else toast.error(result.error);
    });
  }

  function handleRestore(member: MemberRow, silent = false) {
    startTransition(async () => {
      const result = await restoreMember(orgSlug, { memberId: member.id });
      if (!result.ok) toast.error(result.error);
      else if (!silent) toast.success(`Restored ${member.name ?? member.email}`);
    });
  }

  function handleSuspend(member: MemberRow) {
    startTransition(async () => {
      const result = await suspendMember(orgSlug, { memberId: member.id });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast(`Suspended ${member.name ?? member.email}`, {
        description: "They can no longer access this workspace.",
        action: { label: "Undo", onClick: () => handleRestore(member, true) },
        duration: 8000,
      });
    });
  }

  function handleRevoke(invitation: InvitationRow) {
    startTransition(async () => {
      const result = await revokeInvitation(orgSlug, { invitationId: invitation.id });
      if (result.ok) toast.success(`Revoked invitation for ${invitation.email}`);
      else toast.error(result.error);
    });
  }

  const actions = (m: MemberRow) => (
    <MemberActions
      member={m}
      roles={roles}
      perms={perms}
      currentMemberId={currentMemberId}
      onChangeRole={handleChangeRole}
      onSuspend={handleSuspend}
      onRestore={(mm) => handleRestore(mm)}
    />
  );

  const cards = (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {filtered.map((m) => (
        <li key={m.id}>
          <Card className={cn("gap-0 p-4", m.status === "SUSPENDED" && "opacity-70")}>
            <div className="flex items-start gap-3">
              <UserAvatar name={m.name} email={m.email} image={m.image} className="size-9" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">
                  {m.name ?? m.email}
                  {m.id === currentMemberId ? <span className="ml-1 text-xs text-muted-foreground">(you)</span> : null}
                </p>
                <p className="truncate text-xs text-muted-foreground">{m.title ?? m.email}</p>
              </div>
              {actions(m)}
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">Role</dt>
              <dd className="truncate text-right">{m.roleName}</dd>
              <dt className="text-muted-foreground">Department</dt>
              <dd className="truncate text-right">{m.department ?? "—"}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="text-right">
                <StatusBadge status={m.status} />
              </dd>
            </dl>
          </Card>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="space-y-6">
      <section aria-labelledby="members-heading" className="rounded-xl border bg-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4">
          <div>
            <h2 id="members-heading" className="text-base font-semibold">
              Members
            </h2>
            <p className="text-sm text-muted-foreground">{counts.ACTIVE} active · {counts.SUSPENDED} suspended</p>
          </div>
          {perms.canInvite ? <InviteDialog orgSlug={orgSlug} roles={roles.filter((r) => r.key !== "owner" || perms.isOwner)} defaultOpen={openInvite} /> : null}
        </div>
        <ViewsBar
          className="mt-2 border-b px-4"
          activeId={view}
          onSelect={(id) => setView(id as "table" | "cards")}
          views={[
            { id: "table", name: "Table", kind: "table" },
            { id: "cards", name: "Cards", kind: "cards" },
          ]}
        >
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search members"
              aria-label="Search members"
              className="h-8 w-44 pl-8 sm:w-56"
            />
          </div>
          <div role="group" aria-label="Filter by status" className="hidden rounded-md border p-0.5 sm:flex">
            {(["ACTIVE", "SUSPENDED", "ALL"] as const).map((s) => (
              <button
                key={s}
                type="button"
                aria-pressed={status === s}
                onClick={() => setStatus(s)}
                className={cn(
                  "rounded px-2 py-1 text-xs",
                  status === s ? "bg-primary font-medium text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s === "ALL" ? "All" : s === "ACTIVE" ? "Active" : "Suspended"} ({counts[s]})
              </button>
            ))}
          </div>
        </ViewsBar>

        <div className="p-4">
          {filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={query ? "No members match your search" : "No members here"}
              description={query ? "Try a different name, email, role or department." : "Invite your teammates to get started."}
              action={
                query ? (
                  <Button variant="outline" onClick={() => setQuery("")}>
                    <X /> Clear search
                  </Button>
                ) : undefined
              }
            />
          ) : view === "cards" ? (
            cards
          ) : (
            <>
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead className="hidden lg:table-cell">Location</TableHead>
                      <TableHead className="hidden lg:table-cell">Reports to</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="hidden xl:table-cell">Joined</TableHead>
                      <TableHead className="w-10">
                        <span className="sr-only">Actions</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((m) => (
                      <TableRow key={m.id} className={cn(m.status === "SUSPENDED" && "opacity-70")}>
                        <TableCell>
                          <div className="flex min-w-0 items-center gap-2.5">
                            <UserAvatar name={m.name} email={m.email} image={m.image} />
                            <div className="min-w-0">
                              <p className="truncate font-medium">
                                {m.name ?? m.email}
                                {m.id === currentMemberId ? <span className="ml-1 text-xs font-normal text-muted-foreground">(you)</span> : null}
                              </p>
                              <p className="truncate text-xs text-muted-foreground">{m.title ? `${m.title} · ${m.email}` : m.email}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{m.roleName}</TableCell>
                        <TableCell>{m.department ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{m.location ?? "—"}</TableCell>
                        <TableCell className="hidden lg:table-cell">{m.manager ?? "—"}</TableCell>
                        <TableCell>
                          <StatusBadge status={m.status} />
                        </TableCell>
                        <TableCell className="hidden text-muted-foreground xl:table-cell">{dateFmt.format(new Date(m.joinedAt))}</TableCell>
                        <TableCell>{actions(m)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="md:hidden">{cards}</div>
            </>
          )}
        </div>
      </section>

      <section aria-labelledby="invites-heading" className="rounded-xl border bg-card p-4">
        <h2 id="invites-heading" className="text-base font-semibold">
          Pending invitations
        </h2>
        {invitations.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No pending invitations.</p>
        ) : (
          <ul className="mt-3 divide-y">
            {invitations.map((inv) => (
              <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {inv.roleName} · {inv.expired ? "Expired" : `Expires ${dateFmt.format(new Date(inv.expiresAt))}`}
                  </p>
                </div>
                {perms.canSuspend ? (
                  <Button variant="outline" size="sm" onClick={() => handleRevoke(inv)}>
                    Revoke
                  </Button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
