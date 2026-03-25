export type SectorSignal = {
  title: string;
  link: string;
  publishedAt: string;
  summary: string;
};

export type GeneratedIdea = {
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

const GOOGLE_NEWS_BASE =
  "https://news.google.com/rss/search?hl=en-US&gl=US&ceid=US:en&q=";

function extractTagValue(text: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)</${tagName}>`, "i");
  const match = text.match(regex);
  return match?.[1]?.trim() ?? "";
}

function decodeXmlEntities(input: string): string {
  return input
    .replaceAll("&amp;", "&")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("<![CDATA[", "")
    .replaceAll("]]>", "");
}

function parseRssItems(xml: string): SectorSignal[] {
  const items: SectorSignal[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;

  for (const match of xml.matchAll(itemRegex)) {
    const itemXml = match[1];
    const title = decodeXmlEntities(extractTagValue(itemXml, "title"));
    const link = decodeXmlEntities(extractTagValue(itemXml, "link"));
    const publishedAt = decodeXmlEntities(extractTagValue(itemXml, "pubDate"));
    const summary = decodeXmlEntities(extractTagValue(itemXml, "description"));

    if (!title || !link) {
      continue;
    }

    items.push({
      title,
      link,
      publishedAt,
      summary,
    });
  }

  return items;
}

export async function fetchSectorSignals(
  sector: string,
  region: string,
  timeframeDays: number,
): Promise<SectorSignal[]> {
  const query = encodeURIComponent(
    `${sector} ${region} innovation startup technology trend`,
  );

  const response = await fetch(`${GOOGLE_NEWS_BASE}${query}`, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch sector signals.");
  }

  const xml = await response.text();
  const items = parseRssItems(xml);

  const now = Date.now();
  const cutoff = now - timeframeDays * 24 * 60 * 60 * 1000;

  return items
    .filter((item) => {
      const parsed = Date.parse(item.publishedAt);
      return Number.isNaN(parsed) ? true : parsed >= cutoff;
    })
    .slice(0, 10);
}

function clampScore(value: unknown): number {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return 5;
  }

  return Math.max(1, Math.min(10, Math.round(value)));
}

function asStringArray(value: unknown, maxItems = 5): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => String(item ?? "").trim())
    .filter((item) => item.length > 0)
    .slice(0, maxItems);
}

function normalizeIdeas(raw: unknown): GeneratedIdea[] {
  if (!Array.isArray(raw)) {
    return [];
  }

  return raw
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const data = item as Record<string, unknown>;

      return {
        title: String(data.title ?? "").trim(),
        oneLinePitch: String(data.oneLinePitch ?? "").trim(),
        problem: String(data.problem ?? "").trim(),
        solution: String(data.solution ?? "").trim(),
        differentiator: String(data.differentiator ?? "").trim(),
        strengths: asStringArray(data.strengths, 6),
        marketResearch: String(data.marketResearch ?? "").trim(),
        marketSizeNote: String(data.marketSizeNote ?? "").trim(),
        executionPlan: String(data.executionPlan ?? "").trim(),
        revenueModel: String(data.revenueModel ?? "").trim(),
        risks: asStringArray(data.risks, 5),
        whyNow: String(data.whyNow ?? "").trim(),
        targetUsers: String(data.targetUsers ?? "").trim(),
        noveltyScore: clampScore(data.noveltyScore),
        feasibilityScore: clampScore(data.feasibilityScore),
        impactScore: clampScore(data.impactScore),
        confidenceScore: clampScore(data.confidenceScore),
        sourceLinks: asStringArray(data.sourceLinks, 4),
      } satisfies GeneratedIdea;
    })
    .filter(
      (idea): idea is GeneratedIdea =>
        idea !== null &&
        idea.title.length > 0 &&
        idea.oneLinePitch.length > 0 &&
        idea.problem.length > 0 &&
        idea.solution.length > 0 &&
        idea.marketResearch.length > 0,
    )
    .slice(0, 10);
}

export async function generateIdeasWithGemini(input: {
  sector: string;
  region: string;
  timeframeDays: number;
  signals: SectorSignal[];
}): Promise<GeneratedIdea[]> {
  const apiKey = (
    process.env.GEMINI_API_KEY ??
    process.env.GOOGLE_API_KEY ??
    process.env.GENAI_API_KEY ??
    process.env.GEMIN_API_KEY ??
    ""
  ).trim();
  const model = (process.env.GEMINI_MODEL ?? "gemini-2.0-flash").trim();

  if (!apiKey) {
    throw new Error(
      "Gemini API key is missing. Set GEMINI_API_KEY in .env.local (or GOOGLE_API_KEY / GENAI_API_KEY), then restart the dev server.",
    );
  }

  const prompt = [
    "You are a startup innovation analyst and venture researcher.",
    `Sector: ${input.sector}`,
    `Region focus: ${input.region}`,
    `Timeframe in days: ${input.timeframeDays}`,
    "Use the news signals below as evidence to think deeply and generate 5 genuine, non-generic startup ideas.",
    "Do not output raw news list. Output startup ideas with strong market reasoning.",
    "Output ONLY valid JSON with this schema:",
    '{"ideas":[{"title":"","oneLinePitch":"","problem":"","solution":"","differentiator":"","strengths":[""],"marketResearch":"","marketSizeNote":"","executionPlan":"","revenueModel":"","risks":[""],"whyNow":"","targetUsers":"","noveltyScore":1,"feasibilityScore":1,"impactScore":1,"confidenceScore":1,"sourceLinks":[""]}]}',
    "Scores must be integers from 1 to 10.",
    "Rules:",
    "1) Title must be specific and product-like, not generic.",
    "2) marketResearch must include demand signal, competitor gap, and customer willingness-to-pay insight.",
    "3) executionPlan should include concrete first 90-day milestones.",
    "4) Add 2-4 relevant sourceLinks from provided signals per idea.",
    "Signals:",
    JSON.stringify(input.signals, null, 2),
  ].join("\n");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json",
        },
      }),
    },
  );

  if (!response.ok) {
    const failureText = await response.text();
    throw new Error(`Gemini request failed: ${failureText.slice(0, 240)}`);
  }

  const data = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  };

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Gemini returned an empty response.");
  }

  const parsed = JSON.parse(text) as { ideas?: unknown };
  const ideas = normalizeIdeas(parsed.ideas);
  if (ideas.length === 0) {
    throw new Error("Gemini returned invalid idea schema.");
  }

  return ideas;
}
