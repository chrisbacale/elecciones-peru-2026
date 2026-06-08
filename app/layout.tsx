import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import { Navbar } from "@/components/layout/Navbar";
import { QueryProvider } from "@/components/providers/query-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem("radar-electoral-theme");
    var theme = stored === "light" || stored === "dark"
      ? stored
      : (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (_) {}
})();
`;

export const metadata: Metadata = {
  title: "Radar Electoral Perú — Segunda vuelta 2001–2026",
  description:
    "Dashboard en vivo de ONPE 2026, histórico Ipsos vs ONPE 2001–2021 y análisis estadístico de boca de urna, conteo rápido y resultado oficial.",
  metadataBase: new URL("https://elecciones-peru-2026-liart.vercel.app"),
  openGraph: {
    title: "Radar Electoral Perú — Segunda vuelta 2001–2026",
    description:
      "ONPE en vivo, comparador de 5 fuentes 2026, auditoría histórica de error Ipsos y análisis territorial.",
    type: "website",
    locale: "es_PE",
    images: [
      { url: "/og-image.svg", width: 1200, height: 630, alt: "Radar Electoral Perú" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Radar Electoral Perú",
    description: "Dashboard electoral segunda vuelta Perú 2001–2026",
    images: ["/og-image.svg"],
  },
  icons: {
    icon: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${inter.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background font-sans text-foreground">
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
        <ThemeProvider>
          <QueryProvider>
            <Navbar />
            <main className="flex-1">{children}</main>
            <footer className="border-t border-card-border py-6 text-center text-xs text-muted">
              <p>
                Datos de encuestadoras (Ipsos, Datum) no son autoridad electoral.
                Fuente oficial: ONPE/JNE.
              </p>
            </footer>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
