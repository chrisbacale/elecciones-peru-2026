import { describe, expect, it } from "vitest";
import officialSources from "@/data/sources/official-sources.json";

const SOURCE_TYPES = new Set([
  "official_result",
  "official_registry",
  "official_legal",
  "derived_metric",
  "simulation",
]);

const REQUIRED_ENTITY_PREFIXES = [
  "ONPE",
  "JNE",
  "RENIEC",
  "PCM/Gob.pe",
  "Cancilleria/Gob.pe",
];

describe("official source registry", () => {
  it("mantiene una taxonomía explícita y no ambigua", () => {
    expect(officialSources.schema_version).toMatch(/^\d+\.\d+\.\d+$/);
    expect(officialSources.project_rule).toContain("semantically separated");
    expect(new Set(officialSources.source_types)).toEqual(SOURCE_TYPES);
  });

  it("declara fuentes oficiales mínimas para el proceso electoral", () => {
    const ids = officialSources.sources.map((source) => source.id);

    expect(ids).toEqual(expect.arrayContaining([
      "pcm-ds-039-2025",
      "jne-eg-2026",
      "onpe-eg-2026",
      "onpe-resultados",
      "reniec-eg-2026",
      "cancilleria-voto-exterior",
    ]));
  });

  it("exige URL, entidad, tipo y reglas de uso por cada fuente", () => {
    for (const source of officialSources.sources) {
      expect(source.id).toMatch(/^[a-z0-9-]+$/);
      expect(source.source_url).toMatch(/^https:\/\//);
      expect(SOURCE_TYPES.has(source.source_type)).toBe(true);
      expect(source.title.length).toBeGreaterThan(12);
      expect(source.expected_use.length).toBeGreaterThan(20);
      expect(source.must_not_use_for.length).toBeGreaterThan(20);
      expect(
        REQUIRED_ENTITY_PREFIXES.some((prefix) =>
          source.source_entity.startsWith(prefix),
        ),
      ).toBe(true);
    }
  });
});
