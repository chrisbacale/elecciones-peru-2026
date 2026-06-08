import type { Metadata } from "next";
import { DashboardClient } from "@/components/dashboard/DashboardClient";

export const metadata: Metadata = {
  title: "Dashboard — Última hora 2026 | Radar Electoral",
  description:
    "Comparador en vivo de ONPE, boca de urna y conteo rápido — segunda vuelta presidencial 2026",
};

export default function DashboardPage() {
  return <DashboardClient />;
}
