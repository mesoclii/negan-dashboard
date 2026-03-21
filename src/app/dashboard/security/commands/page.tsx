import { Suspense } from "react";
import SlashCommandsClient from "@/app/dashboard/slash-commands/SlashCommandsClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function Loading() {
  return <div style={{ color: "#ff6b6b", padding: 24 }}>Loading slash commands...</div>;
}

export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <SlashCommandsClient />
    </Suspense>
  );
}
