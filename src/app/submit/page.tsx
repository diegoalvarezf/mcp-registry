import { SubmitForm } from "@/components/SubmitForm";

export const metadata = {
  title: "Submit a server — MCP Registry",
};

export default function SubmitPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-3">Submit a server</h1>
        <p className="text-gray-400">
          Share your MCP server with the community. All submissions are reviewed
          before going live.
        </p>
      </div>
      <SubmitForm />
    </div>
  );
}
