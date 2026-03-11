import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default function Page({
  searchParams,
}: {
  searchParams?: { guildId?: string; guildid?: string };
}) {
  const guildId = String(searchParams?.guildId || searchParams?.guildid || "").trim();
  redirect(guildId ? `/dashboard/security?guildId=${encodeURIComponent(guildId)}` : "/dashboard/security");
}
