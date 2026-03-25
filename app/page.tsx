"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { addDoc, collection, getDocs } from "firebase/firestore/lite";
import { useAuth } from "@/components/auth-context";
import { db } from "@/lib/firebase.config";

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

const sectors = [
  "Healthcare",
  "Education",
  "Finance",
  "Agriculture",
  "Energy",
  "Retail",
  "Manufacturing",
  "Logistics",
  "Climate",
  "Cybersecurity",
];

const GENERATED_IDEAS_STORAGE_KEY = "generatedIdeas";

type SavedIdea = Idea & {
  id: string;
  createdAtMs: number;
};

export default function Home() {
  const router = useRouter();
  const { user } = useAuth();
  const [sector, setSector] = useState(sectors[0]);
  const [region, setRegion] = useState("Global");
  const [timeframeDays, setTimeframeDays] = useState(30);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedIdea[]>([]);
  const [signalsCount, setSignalsCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buttonText = useMemo(
    () => (loading ? "Scanning signals and generating..." : "Generate ideas"),
    [loading],
  );

  useEffect(() => {
    if (ideas.length === 0) {
      return;
    }

    window.localStorage.setItem(GENERATED_IDEAS_STORAGE_KEY, JSON.stringify(ideas));
  }, [ideas]);

  useEffect(() => {
    async function loadSavedIdeas() {
      if (!user) {
        setSavedIdeas([]);
        return;
      }

      const ideasRef = collection(db, "users", user.uid, "ideas");
      const snapshot = await getDocs(ideasRef);

      const loaded = snapshot.docs
        .map((docItem) => {
          const data = docItem.data() as Partial<Idea> & { createdAtMs?: number };

          if (!data.title || !data.oneLinePitch || !data.problem) {
            return null;
          }

          return {
            id: docItem.id,
            title: data.title,
            oneLinePitch: data.oneLinePitch,
            problem: data.problem,
            solution: data.solution ?? "",
            differentiator: data.differentiator ?? "",
            strengths: data.strengths ?? [],
            marketResearch: data.marketResearch ?? "",
            marketSizeNote: data.marketSizeNote ?? "",
            executionPlan: data.executionPlan ?? "",
            revenueModel: data.revenueModel ?? "",
            risks: data.risks ?? [],
            whyNow: data.whyNow ?? "",
            targetUsers: data.targetUsers ?? "",
            noveltyScore: data.noveltyScore ?? 0,
            feasibilityScore: data.feasibilityScore ?? 0,
            impactScore: data.impactScore ?? 0,
            confidenceScore: data.confidenceScore ?? 0,
            sourceLinks: data.sourceLinks ?? [],
            createdAtMs: data.createdAtMs ?? 0,
          } satisfies SavedIdea;
        })
        .filter((ideaItem): ideaItem is SavedIdea => ideaItem !== null)
        .sort((a, b) => b.createdAtMs - a.createdAtMs)
        .slice(0, 8);

      setSavedIdeas(loaded);
    }

    loadSavedIdeas().catch(() => {
      setSavedIdeas([]);
    });
  }, [user]);

  async function handleGenerateIdeas() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/generate-ideas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sector,
          region,
          timeframeDays,
        }),
      });

      const data = (await response.json()) as {
        ideas?: Idea[];
        signalsCount?: number;
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Unable to generate ideas right now.");
      }

      const generatedIdeas = data.ideas ?? [];

      setIdeas(generatedIdeas);
      setSignalsCount(data.signalsCount ?? 0);

      if (user && generatedIdeas.length > 0) {
        const ideasRef = collection(db, "users", user.uid, "ideas");
        const createdAtMs = Date.now();

        await Promise.all(
          generatedIdeas.map((idea) =>
            addDoc(ideasRef, {
              ...idea,
              sector,
              region,
              timeframeDays,
              createdAtMs,
            }),
          ),
        );

        const justSaved: SavedIdea[] = generatedIdeas.map((idea, index) => ({
          ...idea,
          id: `local-${createdAtMs}-${index}`,
          createdAtMs,
        }));

        setSavedIdeas((previous) => [...justSaved, ...previous].slice(0, 8));
      }
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : "Unexpected error while generating ideas.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 dark:bg-black dark:text-zinc-100 sm:py-8">
      <main className="mx-auto grid w-full max-w-[1400px] gap-6 lg:grid-cols-[320px_1fr_300px]">
        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-6 lg:h-fit">
          <h1 className="text-xl font-semibold sm:text-2xl">Idea Generator</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Edit your inputs on the left, then generate startup ideas from recent signals.
          </p>

          <div className="mt-5 space-y-4">
            <label className="flex flex-col gap-2 text-sm">
              Sectors
              <select
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                value={sector}
                onChange={(event) => setSector(event.target.value)}
              >
                {sectors.map((sectorOption) => (
                  <option key={sectorOption} value={sectorOption}>
                    {sectorOption}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Global / Region focus
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                type="text"
                value={region}
                onChange={(event) => setRegion(event.target.value)}
                placeholder="Global"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm">
              Days
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                type="number"
                min={1}
                max={365}
                value={timeframeDays}
                onChange={(event) => setTimeframeDays(Number(event.target.value))}
              />
            </label>
          </div>

          <button
            className="mt-5 w-full rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            onClick={handleGenerateIdeas}
            disabled={loading}
          >
            {buttonText}
          </button>

          {error ? (
            <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
              {error}
            </p>
          ) : null}
        </aside>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 sm:p-6">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold sm:text-xl">Generated Ideas</h2>
            <span className="text-xs text-zinc-500 dark:text-zinc-400">
              Signals scanned: {signalsCount}
            </span>
          </div>

          {ideas.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              No ideas yet. Fill the fields on the left and click Generate ideas.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {ideas.map((idea, index) => (
                <button
                  key={`${idea.title}-${index}`}
                  type="button"
                  onClick={() => router.push(`/ideas/${index}`)}
                  className="rounded-xl border border-zinc-200 p-4 text-left transition hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
                >
                  <h3 className="text-base font-semibold">{idea.title}</h3>
                  <p className="mt-2 line-clamp-3 text-sm text-zinc-700 dark:text-zinc-300">
                    {idea.oneLinePitch}
                  </p>
                  <p className="mt-3 line-clamp-2 text-xs text-zinc-600 dark:text-zinc-400">
                    {idea.problem}
                  </p>
                  <p className="mt-3 text-xs text-zinc-600 dark:text-zinc-400">
                    Novelty {idea.noveltyScore}/10 · Feasibility {idea.feasibilityScore}/10
                  </p>
                </button>
              ))}
            </div>
          )}
        </section>

        <aside className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950 lg:sticky lg:top-6 lg:h-fit">
          <h2 className="text-sm font-semibold">Saved idea jobs</h2>
          {savedIdeas.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              No saved ideas yet.
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {savedIdeas.map((savedIdea) => (
                <button
                  key={savedIdea.id}
                  type="button"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-left hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                  onClick={() => {
                    setIdeas([savedIdea]);
                    window.localStorage.setItem(
                      GENERATED_IDEAS_STORAGE_KEY,
                      JSON.stringify([savedIdea]),
                    );
                    router.push("/ideas/0");
                  }}
                >
                  <p className="line-clamp-1 text-xs font-medium">{savedIdea.title}</p>
                  <p className="mt-1 line-clamp-1 text-[11px] text-zinc-600 dark:text-zinc-400">
                    {savedIdea.oneLinePitch}
                  </p>
                </button>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
