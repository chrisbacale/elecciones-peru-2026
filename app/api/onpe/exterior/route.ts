import { NextResponse } from "next/server";
import {
  fetchOnpeExterior,
  getKnownOnpeExteriorSnapshot,
  getOnpeApiMeta,
} from "@/lib/onpe-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET() {
  try {
    const snapshot = getKnownOnpeExteriorSnapshot();
    const data = await fetchOnpeExterior(snapshot);
    const meta = getOnpeApiMeta();

    return NextResponse.json(
      { ...data, meta },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const snapshot = getKnownOnpeExteriorSnapshot();
    const meta = getOnpeApiMeta();

    return NextResponse.json(
      {
        ...snapshot,
        meta,
        status: "snapshot",
        message: "Error al contactar ONPE exterior — usando snapshot conocido",
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
