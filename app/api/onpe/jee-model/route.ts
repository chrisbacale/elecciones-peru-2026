import { NextResponse } from "next/server";
import jeeModel from "@/data/2026/jee-resolution-model.json";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json(
    {
      ...jeeModel,
      message:
        "Modelo auditado de actas pendientes/JEE: exterior solo agregado; no es proclamacion oficial.",
    },
    {
      headers: {
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
}
