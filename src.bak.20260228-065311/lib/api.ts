export async function fetchGuildData() {
  const res = await fetch("http://localhost:3001/guild-data");
  if (!res.ok) throw new Error("Guild fetch failed");
  return res.json();
}
