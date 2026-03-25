import { fetchSectorSignals, generateIdeasWithGemini } from "@/lib/idea-engine";

type GenerateIdeasRequest = {
  sector?: string;
  region?: string;
  timeframeDays?: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as GenerateIdeasRequest;

    const sector = body.sector?.trim();
    const region = body.region?.trim() || "global";
    const timeframeDays =
      typeof body.timeframeDays === "number" && body.timeframeDays > 0
        ? Math.min(body.timeframeDays, 365)
        : 30;

    if (!sector) {
      return Response.json(
        { error: "Sector is required." },
        { status: 400 },
      );
    }

    const signals = await fetchSectorSignals(sector, region, timeframeDays);
    const ideas = await generateIdeasWithGemini({
      sector,
      region,
      timeframeDays,
      signals,
    });

    return Response.json({
      sector,
      region,
      timeframeDays,
      generatedAt: new Date().toISOString(),
      signalsCount: signals.length,
      ideas,
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to generate ideas. Please try again.";

    return Response.json(
      { error: message },
      { status: 500 },
    );
  }
}
