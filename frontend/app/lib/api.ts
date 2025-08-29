const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4100";

export async function fetchSpecs() {
  const res = await fetch(`${API_BASE}/specs`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch specs");
  return res.json();
}

export async function fetchSpec(id: string) {
  const res = await fetch(`${API_BASE}/specs/${id}`, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch spec " + id);
  return res.json();
}
