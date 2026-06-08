import { NextResponse } from "next/server";
import { buildPredictionSnapshot } from "@/lib/prediction";
import { fetchOnpeResumen, getKnownOnpeSnapshot, getOnpeApiMeta } from "@/lib/onpe-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const onpe = await fetchOnpeResumen(getKnownOnpeSnapshot());
    const prediction = buildPredictionSnapshot(onpe);

    return NextResponse.json(
      { ...prediction, meta: getOnpeApiMeta() },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const prediction = buildPredictionSnapshot(getKnownOnpeSnapshot());

    return NextResponse.json(
      {
        ...prediction,
        meta: getOnpeApiMeta(),
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  }
}
