import { redirect } from "next/navigation";

export default async function OrgIndex({ params }: { params: Promise<{ orgSlug: string }> }) {
  redirect(`/w/${(await params).orgSlug}/home`);
}
