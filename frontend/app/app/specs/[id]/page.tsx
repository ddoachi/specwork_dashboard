import { fetchSpec } from "../../../lib/api";

interface Props {
  params: { id: string };
}

export default async function SpecDetailPage({ params }: Props) {
  const spec = await fetchSpec(params.id);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-2">{spec.title}</h1>
      <p className="mb-2">ID: {spec.id}</p>
      <p className="mb-2">Type: {spec.type}</p>
      <p className="mb-2">Status: {spec.status}</p>
      <p className="mb-2">Priority: {spec.priority}</p>

      {spec.tags?.length > 0 && (
        <div className="flex gap-2 mt-2">
          {spec.tags.map((t: string) => (
            <span
              key={t}
              className="px-2 py-1 bg-gray-200 rounded text-sm"
            >
              #{t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
