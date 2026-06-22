'use client';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ padding: 20, fontFamily: 'Arial, Helvetica, sans-serif' }}>
      <h1>Terjadi error</h1>
      <pre style={{ whiteSpace: 'pre-wrap' }}>{error.message}</pre>
      <button
        className="btn primary"
        onClick={() => reset()}
        style={{ marginTop: 12 }}
      >
        Coba lagi
      </button>
    </div>
  );
}

