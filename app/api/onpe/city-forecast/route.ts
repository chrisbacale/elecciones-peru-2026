import { NextResponse } from "next/server";
import cityForecast from "@/data/2026/city-level-forecast.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ...cityForecast,
      message:
        "Snapshot ciudad/distrito auditado: Perú interior por distrito/provincia y exterior solo agregado.",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
