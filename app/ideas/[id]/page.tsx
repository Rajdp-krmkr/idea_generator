"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";

type Idea = {
  title: string;
  oneLinePitch: string;
  problem: string;
  solution: string;
  differentiator: string;
  strengths: string[];
  marketResearch: string;
  marketSizeNote: string;
  executionPlan: string;
  revenueModel: string;
  risks: string[];
  whyNow: string;
  targetUsers: string;
  noveltyScore: number;
  feasibilityScore: number;
  impactScore: number;
  confidenceScore: number;
  sourceLinks: string[];
};

const GENERATED_IDEAS_STORAGE_KEY = "generatedIdeas";

export default function IdeaDetailPage() {
  const params = useParams<{ id: string }>();
  const [ideas] = useState<Idea[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    const raw = window.localStorage.getItem(GENERATED_IDEAS_STORAGE_KEY);
    if (!raw) {
      return [];
    }

    try {
      const parsed = JSON.parse(raw) as Idea[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });

  const ideaIndex = Number(params.id);

  const idea = useMemo(() => {
    if (!Number.isInteger(ideaIndex) || ideaIndex < 0 || ideaIndex >= ideas.length) {
      return null;
    }

    return ideas[ideaIndex];
  }, [ideaIndex, ideas]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:py-8">
      <main className="mx-auto w-full max-w-4xl rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
        <Link
          href="/"
          className="inline-flex rounded-lg border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          ← Back to ideas
        </Link>

        {!idea ? (
          <div className="mt-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h1 className="text-lg font-semibold">Idea not found</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Generate ideas first, then open a card to view details.
            </p>
          </div>
        ) : (
          <article className="mt-6">
            <h1 className="text-2xl font-semibold sm:text-3xl">{idea.title}</h1>
            <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
              {idea.oneLinePitch}
            </p>

            <div className="mt-4 grid gap-3 rounded-xl border border-zinc-200 p-4 text-sm dark:border-zinc-800 sm:grid-cols-2">
              <p>Novelty: {idea.noveltyScore}/10</p>
              <p>Feasibility: {idea.feasibilityScore}/10</p>
              <p>Impact: {idea.impactScore}/10</p>
              <p>Confidence: {idea.confidenceScore}/10</p>
            </div>

            <div className="mt-6 space-y-4 text-sm">
              <p><strong>Problem:</strong> {idea.problem}</p>
              <p><strong>Solution:</strong> {idea.solution}</p>
              <p><strong>Differentiator:</strong> {idea.differentiator}</p>
              <p><strong>Why now:</strong> {idea.whyNow}</p>
              <p><strong>Target users:</strong> {idea.targetUsers}</p>
              <p><strong>Market research:</strong> {idea.marketResearch}</p>
              <p><strong>Market size note:</strong> {idea.marketSizeNote}</p>
              <p><strong>Execution plan:</strong> {idea.executionPlan}</p>
              <p><strong>Revenue model:</strong> {idea.revenueModel}</p>
            </div>

            {idea.strengths.length > 0 ? (
              <div className="mt-5">
                <h2 className="text-base font-semibold">Strengths</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {idea.strengths.map((strength, index) => (
                    <li key={`${strength}-${index}`}>{strength}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {idea.risks.length > 0 ? (
              <div className="mt-5">
                <h2 className="text-base font-semibold">Risks</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                  {idea.risks.map((risk, index) => (
                    <li key={`${risk}-${index}`}>{risk}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {idea.sourceLinks.length > 0 ? (
              <div className="mt-5">
                <h2 className="text-base font-semibold">Sources</h2>
                <div className="mt-2 flex flex-wrap gap-2">
                  {idea.sourceLinks.map((link, index) => (
                    <a
                      key={`${link}-${index}`}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-medium text-blue-600 underline dark:text-blue-400"
                    >
                      Source {index + 1}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        )}
      </main>
    </div>
  );
}
