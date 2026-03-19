import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const rawGuildId = params.guildId || params.guildid || "";
  const gid = String(Array.isArray(rawGuildId) ? rawGuildId[0] || "" : rawGuildId).trim();
  if (gid) {
    redirect(`/dashboard/achievements?guildId=${encodeURIComponent(gid)}&guildid=${encodeURIComponent(gid)}`);
  }
  redirect("/dashboard/achievements");
}
