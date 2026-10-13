"use client";

import { Loader2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { FormField } from "@/components/common/form-field";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COUNTRIES, MONTHS, TIMEZONES, WEEKDAYS } from "@/config/app";
import { SUPPORTED_CURRENCIES } from "@/lib/money";
import { updateOrganizationSettings } from "@/server/modules/org/actions";

export interface GeneralSettingsValues {
  name: string;
  country: string;
  baseCurrency: (typeof SUPPORTED_CURRENCIES)[number];
  timezone: (typeof TIMEZONES)[number];
  fiscalYearStartMonth: number;
  weekStartsOn: number;
  workingDays: number[];
  workdayStartMinutes: number;
  workdayEndMinutes: number;
}

const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const fromTime = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
};

function SimpleSelect({
  id,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  value: string;
  onChange(v: string): void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger id={id} className="w-full">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function GeneralSettingsForm({
  orgSlug,
  initial,
  canEdit,
}: {
  orgSlug: string;
  initial: GeneralSettingsValues;
  canEdit: boolean;
}) {
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<Record<string, string[] | undefined>>({});
  const [pending, startTransition] = useTransition();
  const set = <K extends keyof GeneralSettingsValues>(key: K, value: GeneralSettingsValues[K]) =>
    setValues((v) => ({ ...v, [key]: value }));
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await updateOrganizationSettings(orgSlug, values);
      if (result.ok) {
        setErrors({});
        toast.success("Workspace settings saved");
      } else {
        setErrors(result.fieldErrors ?? {});
        toast.error(result.error);
      }
    });
  }

  const disabled = !canEdit || pending;

  return (
    <form onSubmit={submit} className="max-w-3xl space-y-5" noValidate>
      {!canEdit ? (
        <p className="rounded-md border bg-muted px-3 py-2 text-sm">You can view these settings but not change them.</p>
      ) : null}
      <Card>
        <CardHeader>
          <CardTitle>Organisation</CardTitle>
          <CardDescription>Name, country and money settings used across every module.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <FormField id="name" label="Organisation name" error={errors.name} className="sm:col-span-2">
            <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} disabled={disabled} aria-invalid={Boolean(errors.name)} />
          </FormField>
          <FormField id="country" label="Country" error={errors.country}>
            <SimpleSelect id="country" value={values.country} onChange={(v) => set("country", v)} disabled={disabled} options={COUNTRIES.map((c) => ({ value: c.code, label: c.name }))} />
          </FormField>
          <FormField id="baseCurrency" label="Base currency" error={errors.baseCurrency} hint="Locked once accounting transactions exist (phase 9).">
            <SimpleSelect id="baseCurrency" value={values.baseCurrency} onChange={(v) => set("baseCurrency", v as GeneralSettingsValues["baseCurrency"])} disabled={disabled} options={SUPPORTED_CURRENCIES.map((c) => ({ value: c, label: c }))} />
          </FormField>
          <FormField id="timezone" label="Time zone" error={errors.timezone}>
            <SimpleSelect id="timezone" value={values.timezone} onChange={(v) => set("timezone", v as GeneralSettingsValues["timezone"])} disabled={disabled} options={TIMEZONES.map((t) => ({ value: t, label: t }))} />
          </FormField>
          <FormField id="fy" label="Financial year starts" error={errors.fiscalYearStartMonth}>
            <SimpleSelect id="fy" value={String(values.fiscalYearStartMonth)} onChange={(v) => set("fiscalYearStartMonth", Number(v))} disabled={disabled} options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))} />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Working time</CardTitle>
          <CardDescription>Drives leave day counts, workload capacity and attendance.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <fieldset className="space-y-2 sm:col-span-2">
            <legend className="text-sm font-medium">Working days</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day, index) => {
                const checked = values.workingDays.includes(index);
                return (
                  <label key={day} className="flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-sm has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60">
                    <Checkbox
                      checked={checked}
                      disabled={disabled}
                      onCheckedChange={(c) =>
                        set("workingDays", c ? [...values.workingDays, index].sort((a, b) => a - b) : values.workingDays.filter((d) => d !== index))
                      }
                    />
                    {day.slice(0, 3)}
                  </label>
                );
              })}
            </div>
            {errors.workingDays ? <p className="text-xs text-destructive">{errors.workingDays[0]}</p> : null}
          </fieldset>
          <FormField id="weekStartsOn" label="Week starts on" error={errors.weekStartsOn}>
            <SimpleSelect id="weekStartsOn" value={String(values.weekStartsOn)} onChange={(v) => set("weekStartsOn", Number(v))} disabled={disabled} options={WEEKDAYS.map((d, i) => ({ value: String(i), label: d }))} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField id="start" label="Day starts" error={errors.workdayStartMinutes}>
              <Input id="start" type="time" value={toTime(values.workdayStartMinutes)} onChange={(e) => set("workdayStartMinutes", fromTime(e.target.value))} disabled={disabled} />
            </FormField>
            <FormField id="end" label="Day ends" error={errors.workdayEndMinutes}>
              <Input id="end" type="time" value={toTime(values.workdayEndMinutes)} onChange={(e) => set("workdayEndMinutes", fromTime(e.target.value))} disabled={disabled} aria-invalid={Boolean(errors.workdayEndMinutes)} />
            </FormField>
          </div>
        </CardContent>
        {canEdit ? (
          <CardFooter className="justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" disabled={!dirty || pending} onClick={() => setValues(initial)}>
              Reset
            </Button>
            <Button type="submit" disabled={!dirty || pending}>
              {pending ? <Loader2 className="animate-spin" /> : null}
              Save changes
            </Button>
          </CardFooter>
        ) : null}
      </Card>
    </form>
  );
}
