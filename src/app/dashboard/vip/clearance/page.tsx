import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function VipClearancePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) || {};
  const guildId = Array.isArray(params.guildId) ? params.guildId[0] : params.guildId;
  redirect(guildId ? `/dashboard/vip?guildId=${encodeURIComponent(guildId)}#clearance` : "/dashboard/vip#clearance");
}
