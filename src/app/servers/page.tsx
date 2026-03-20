import { redirect } from "next/navigation";

// /servers redirects to home — same page, just different nav entry point
export default function ServersPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams(searchParams).toString();
  redirect(params ? `/?${params}` : "/");
}
