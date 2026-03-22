import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getStack } from "@/lib/stacks";
import { EditStackForm } from "./EditStackForm";

export const dynamic = "force-dynamic";

export default async function EditStackPage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session) redirect(`/auth/signin?callbackUrl=/stacks/${params.slug}/edit`);

  // Curated stacks can't be edited
  if (getStack(params.slug)) notFound();

  const stack = await prisma.userStack.findUnique({
    where: { slug: params.slug },
    include: { items: { orderBy: { order: "asc" } } },
  });
  if (!stack) notFound();

  const isOwner = stack.createdBy === session.user.githubLogin || session.user.role === "admin";
  if (!isOwner) notFound();

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <a href={`/stacks/${params.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-white transition-colors mb-8">
        ← Back to stack
      </a>
      <h1 className="text-2xl font-bold mb-8">Edit stack</h1>
      <EditStackForm
        slug={params.slug}
        initialName={stack.name}
        initialDescription={stack.description ?? ""}
        initialIcon={stack.icon}
        initialPublic={stack.public}
        initialItems={stack.items.map(i => ({ type: i.type, itemSlug: i.itemSlug }))}
      />
    </div>
  );
}
