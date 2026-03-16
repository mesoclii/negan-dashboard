import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page({
  searchParams,
}: {
  searchParams?: { guildId?: string; guildid?: string };
}) {
  const gid = String(searchParams?.guildId || searchParams?.guildid || "").trim();
  if (gid) {
    redirect(`/dashboard/utilities?guildId=${encodeURIComponent(gid)}&guildid=${encodeURIComponent(gid)}`);
  }
  redirect("/dashboard/utilities");
}
