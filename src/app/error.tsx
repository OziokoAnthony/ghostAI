"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-8">
      <h2 className="text-xl font-bold">Something went wrong</h2>
      <p className="max-w-md text-center text-sm text-gray-500">
        {error.message}
      </p>
      <button
        onClick={reset}
        className="rounded border px-4 py-2 text-sm hover:bg-gray-50"
      >
        Try again
      </button>
    </main>
  );
}
