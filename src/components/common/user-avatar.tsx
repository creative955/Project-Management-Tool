import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export function initials(name: string | null | undefined, fallback = "?"): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return fallback;
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return `${first}${last}`.toUpperCase();
}

export function UserAvatar({
  name,
  email,
  image,
  className,
}: {
  name: string | null;
  email?: string;
  image?: string | null;
  className?: string;
}) {
  return (
    <Avatar className={cn("size-7", className)}>
      {image ? <AvatarImage src={image} alt="" /> : null}
      <AvatarFallback className="bg-secondary text-[11px] font-semibold">
        {initials(name, email?.[0]?.toUpperCase())}
      </AvatarFallback>
    </Avatar>
  );
}
