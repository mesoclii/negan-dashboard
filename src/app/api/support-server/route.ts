import { NextResponse } from "next/server";
import { SUPPORT_SERVER_GUILD_ID } from "@/lib/publicLinks";

function normalizeInviteUrl(value: unknown) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (/^https?:\/\//i.test(text)) return text;
  return `https://${text.replace(/^\/+/, "")}`;
}

export async function GET() {
  const configuredInvite = normalizeInviteUrl(
    process.env.SUPPORT_SERVER_INVITE_URL || process.env.NEXT_PUBLIC_SUPPORT_SERVER_INVITE_URL
  );

  if (configuredInvite) {
    return NextResponse.redirect(configuredInvite, { status: 307 });
  }

  try {
    const widgetRes = await fetch(
      `https://discord.com/api/guilds/${SUPPORT_SERVER_GUILD_ID}/widget.json`,
      {
        cache: "no-store",
      }
    );
    const widgetJson = await widgetRes.json().catch(() => ({}));
    const instantInvite = normalizeInviteUrl(widgetJson?.instant_invite);
    if (widgetRes.ok && instantInvite) {
      return NextResponse.redirect(instantInvite, { status: 307 });
    }
  } catch {}

  return NextResponse.redirect(`https://discord.com/channels/${SUPPORT_SERVER_GUILD_ID}`, {
    status: 307,
  });
}
