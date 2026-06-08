import { NextResponse } from "next/server";
import { getErrorMetrics } from "@/lib/data";

export const dynamic = "force-static";

export async function GET() {
  const metrics = getErrorMetrics();

  return NextResponse.json(metrics, {
    headers: {
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
