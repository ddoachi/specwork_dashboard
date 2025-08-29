import Link from "next/link";

export default function HomePage() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Welcome to SpecHub Dashboard</h1>
      <p className="mt-4">
        <Link href="/specs" className="text-blue-600 underline">
          Go to Specs
        </Link>
      </p>
    </main>
  );
}
