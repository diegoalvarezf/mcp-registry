import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin");
  if (session.user.role !== "admin") notFound();

  const [total, verified, recent, topDownloaded] = await Promise.all([
    prisma.server.count(),
    prisma.server.count({ where: { verified: true } }),
    prisma.server.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: { id: true, name: true, slug: true, authorName: true, verified: true, featured: true, downloadCount: true, createdAt: true },
    }),
    prisma.server.findMany({
      orderBy: { downloadCount: "desc" },
      take: 5,
      select: { name: true, slug: true, downloadCount: true },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="text-2xl font-bold mb-8">Admin Panel</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: "Total servers", value: total },
          { label: "Verified", value: verified },
          { label: "Top downloads", value: topDownloaded[0]?.downloadCount ?? 0 },
          { label: "This month", value: recent.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <p className="text-2xl font-bold text-white">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Top downloaded */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Top downloads</h2>
        <div className="space-y-2">
          {topDownloaded.map((s) => (
            <div key={s.slug} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <a href={`/server/${s.slug}`} className="text-sm text-white hover:text-blue-400 transition-colors">{s.name}</a>
              <span className="text-sm text-gray-400">{s.downloadCount} installs</span>
            </div>
          ))}
        </div>
      </section>

      {/* Recent servers */}
      <section>
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-4">Recent servers (last 20)</h2>
        <div className="space-y-2">
          {recent.map((s) => (
            <div key={s.id} className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <div>
                <a href={`/server/${s.slug}`} className="text-sm text-white hover:text-blue-400 transition-colors">{s.name}</a>
                <p className="text-xs text-gray-500">by {s.authorName} · {s.downloadCount} installs</p>
              </div>
              <div className="flex items-center gap-2">
                {s.verified && <span className="text-xs text-blue-400">✓</span>}
                {s.featured && <span className="text-xs text-yellow-400">★</span>}
                <ToggleVerified slug={s.slug} verified={s.verified} />
                <ToggleFeatured slug={s.slug} featured={s.featured} />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function ToggleVerified({ slug, verified }: { slug: string; verified: boolean }) {
  return (
    <form action={`/api/admin/servers/${slug}/verify`} method="POST">
      <button
        type="submit"
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          verified
            ? "border-blue-700 text-blue-400 hover:border-red-500 hover:text-red-400"
            : "border-gray-700 text-gray-500 hover:border-blue-500 hover:text-blue-400"
        }`}
      >
        {verified ? "✓ verified" : "Verify"}
      </button>
    </form>
  );
}

function ToggleFeatured({ slug, featured }: { slug: string; featured: boolean }) {
  return (
    <form action={`/api/admin/servers/${slug}/feature`} method="POST">
      <button
        type="submit"
        className={`text-xs px-2 py-1 rounded border transition-colors ${
          featured
            ? "border-yellow-700 text-yellow-400 hover:border-gray-500 hover:text-gray-400"
            : "border-gray-700 text-gray-500 hover:border-yellow-500 hover:text-yellow-400"
        }`}
      >
        {featured ? "★ featured" : "Feature"}
      </button>
    </form>
  );
}
