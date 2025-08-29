import Link from "next/link";
import { fetchSpecs } from "../../lib/api";

export default async function SpecListPage() {
  const specs = await fetchSpecs();

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Specs</h1>
      <ul className="space-y-2">
        {specs.map((s: any) => (
          <li key={s.id} className="border p-2 rounded hover:bg-gray-50">
            <Link href={`/specs/${s.id}`} className="text-blue-600 underline">
              {s.title} ({s.type}) - {s.status}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
