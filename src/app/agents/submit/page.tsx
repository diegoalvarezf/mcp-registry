import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SubmitSkillForm } from "@/app/skills/submit/SubmitSkillForm";

export const metadata: Metadata = { title: "Submit an Agent — MCPHub" };

export default async function SubmitAgentPage() {
  const session = await auth();
  if (!session) redirect("/auth/signin?callbackUrl=/agents/submit");

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
      <div className="mb-8">
        <a href="/agents" className="text-sm text-gray-400 hover:text-white transition-colors">
          ← Agents registry
        </a>
      </div>
      <h1 className="text-2xl font-bold mb-2">Submit an agent</h1>
      <p className="text-gray-400 mb-8">
        Share an agent with the MCPHub community. An agent is a system prompt that gives Claude a persistent persona and expertise.
      </p>
      <SubmitSkillForm defaultType="agent" />
    </div>
  );
}
