"use client";

import { Loader2 } from "lucide-react";
import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, MONTHS, TIMEZONES } from "@/config/app";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { createWorkspaceAction, type OnboardingState } from "./actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : null}
      Create workspace
    </Button>
  );
}

export function OnboardingForm({ defaultName }: { defaultName: string }) {
  const [state, action] = useActionState<OnboardingState, FormData>(createWorkspaceAction, {});
  const [name, setName] = useState(defaultName);
  const [slug, setSlug] = useState(slugify(defaultName));
  const [slugEdited, setSlugEdited] = useState(false);
  const [country, setCountry] = useState<string>("IN");
  const preset = COUNTRIES.find((c) => c.code === country) ?? COUNTRIES[0];
  const [currency, setCurrency] = useState<string>(preset.currency);
  const [timezone, setTimezone] = useState<string>(preset.timezone);
  const [fyStart, setFyStart] = useState<string>(String(preset.fyStart));
  const fe = state.fieldErrors ?? {};

  return (
    <form action={action} className="space-y-4" noValidate>
      {state.error ? (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
      <FormField id="name" label="Workspace name" error={fe.name}>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          placeholder="Northlight Studio"
          required
          aria-invalid={Boolean(fe.name)}
        />
      </FormField>
      <FormField id="slug" label="Workspace URL" error={fe.slug} hint={`/w/${slug || "your-team"}`}>
        <Input
          id="slug"
          name="slug"
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value.toLowerCase());
          }}
          required
          aria-invalid={Boolean(fe.slug)}
        />
      </FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField id="country" label="Country" error={fe.country}>
          <Select
            name="country"
            value={country}
            onValueChange={(code) => {
              setCountry(code);
              const c = COUNTRIES.find((x) => x.code === code);
              if (c) {
                setCurrency(c.currency);
                setTimezone(c.timezone);
                setFyStart(String(c.fyStart));
              }
            }}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {COUNTRIES.map((c) => (
                <SelectItem key={c.code} value={c.code}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="baseCurrency" label="Base currency" error={fe.baseCurrency}>
          <Select name="baseCurrency" value={currency} onValueChange={setCurrency}>
            <SelectTrigger id="baseCurrency" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="timezone" label="Time zone" error={fe.timezone}>
          <Select name="timezone" value={timezone} onValueChange={setTimezone}>
            <SelectTrigger id="timezone" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TIMEZONES.map((tz) => (
                <SelectItem key={tz} value={tz}>
                  {tz}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
        <FormField id="fiscalYearStartMonth" label="Financial year starts" error={fe.fiscalYearStartMonth}>
          <Select name="fiscalYearStartMonth" value={fyStart} onValueChange={setFyStart}>
            <SelectTrigger id="fiscalYearStartMonth" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((m, i) => (
                <SelectItem key={m} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormField>
      </div>
      <p className="text-xs text-muted-foreground">
        The base currency is used for your books and reports and can&apos;t be changed once
        transactions are posted.
      </p>
      <Submit />
    </form>
  );
}
