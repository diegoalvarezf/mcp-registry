interface PaginationProps {
  page: number;
  pages: number;
  total: number;
  buildUrl: (page: number) => string;
}

export function Pagination({ page, pages, total, buildUrl }: PaginationProps) {
  if (pages <= 1) return null;

  const prev = page - 1;
  const next = page + 1;

  // Show window of 5 pages around current
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between mt-12 pt-8 border-t border-gray-800">
      <p className="text-sm text-gray-500">
        {total.toLocaleString()} servers
      </p>
      <div className="flex items-center gap-1">
        <PageLink href={prev >= 1 ? buildUrl(prev) : null} label="←" />
        {start > 1 && (
          <>
            <PageLink href={buildUrl(1)} label="1" />
            {start > 2 && <span className="px-2 text-gray-600">…</span>}
          </>
        )}
        {pageNumbers.map((p) => (
          <PageLink
            key={p}
            href={buildUrl(p)}
            label={String(p)}
            active={p === page}
          />
        ))}
        {end < pages && (
          <>
            {end < pages - 1 && <span className="px-2 text-gray-600">…</span>}
            <PageLink href={buildUrl(pages)} label={String(pages)} />
          </>
        )}
        <PageLink href={next <= pages ? buildUrl(next) : null} label="→" />
      </div>
    </div>
  );
}

function PageLink({
  href,
  label,
  active,
}: {
  href: string | null;
  label: string;
  active?: boolean;
}) {
  if (!href) {
    return (
      <span className="w-9 h-9 flex items-center justify-center text-sm text-gray-600 cursor-not-allowed">
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm transition-colors ${
        active
          ? "bg-blue-600 text-white"
          : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }`}
    >
      {label}
    </a>
  );
}
