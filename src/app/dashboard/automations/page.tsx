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
  const guildId = String(Array.isArray(rawGuildId) ? rawGuildId[0] || "" : rawGuildId).trim();
  redirect(
    guildId
      ? `/dashboard/automations/studio?guildId=${encodeURIComponent(guildId)}`
      : "/dashboard/automations/studio"
  );
}
