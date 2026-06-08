import { NextResponse } from "next/server";
import { fetchOnpeTerritorial, getOnpeApiMeta } from "@/lib/onpe-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const data = await fetchOnpeTerritorial();
    const meta = getOnpeApiMeta();

    return NextResponse.json(
      { ...data, meta },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    const meta = getOnpeApiMeta();

    return NextResponse.json(
      {
        status: "snapshot",
        timestamp: new Date().toISOString(),
        departments: [],
        message: "Error al contactar ONPE — sin desglose departamental",
        meta,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  }
}
