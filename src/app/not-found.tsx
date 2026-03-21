export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-32 text-center">
      <div className="text-6xl mb-6">⬡</div>
      <h1 className="text-3xl font-bold mb-3">404 — Not found</h1>
      <p className="text-gray-400 mb-8">
        This page doesn't exist or the server you're looking for has been removed.
      </p>
      <a
        href="/"
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-medium px-6 py-3 rounded-xl transition-colors"
      >
        ← Back to MCPHub
      </a>
    </div>
  );
}
