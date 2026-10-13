"use client";

import { Check, Copy, Loader2, MailPlus } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { inviteMember } from "@/server/modules/org/actions";

export function InviteDialog({
  orgSlug,
  roles,
  defaultOpen,
}: {
  orgSlug: string;
  roles: { id: string; name: string }[];
  defaultOpen: boolean;
}) {
  const defaultRole = roles.find((r) => r.name === "Employee")?.id ?? roles[0]?.id ?? "";
  const [open, setOpen] = useState(defaultOpen);
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(defaultRole);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [pending, startTransition] = useTransition();

  function reset() {
    setEmail("");
    setRoleId(defaultRole);
    setErrors({});
    setLink(null);
    setCopied(false);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await inviteMember(orgSlug, { email, roleId });
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
        return;
      }
      setErrors({});
      setLink(`${window.location.origin}${result.data.invitePath}`);
      toast.success(`Invitation created for ${email}`);
    });
  }

  async function copy() {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    toast.success("Invite link copied");
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <MailPlus /> Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite to workspace</DialogTitle>
          <DialogDescription>
            They&apos;ll join with the role you choose. Links expire after 7 days.
          </DialogDescription>
        </DialogHeader>
        {link ? (
          <div className="space-y-3">
            <p className="text-sm">
              Share this link with <strong>{email}</strong>. It is shown only once — email delivery arrives with the SMTP
              integration.
            </p>
            <div className="flex gap-2">
              <Input readOnly value={link} aria-label="Invitation link" className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
              <Button type="button" variant="outline" size="icon" onClick={copy} aria-label="Copy invitation link">
                {copied ? <Check /> : <Copy />}
              </Button>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={reset}>
                Invite someone else
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <FormField id="invite-email" label="Email" error={errors.email}>
              <Input
                id="invite-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                autoFocus
                aria-invalid={Boolean(errors.email)}
              />
            </FormField>
            <FormField id="invite-role" label="Role" error={errors.roleId}>
              <Select value={roleId} onValueChange={setRoleId}>
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>
            <DialogFooter>
              <Button type="submit" disabled={pending || !email}>
                {pending ? <Loader2 className="animate-spin" /> : null}
                Create invitation
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
