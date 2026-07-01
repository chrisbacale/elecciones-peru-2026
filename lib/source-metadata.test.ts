import { describe, expect, it } from "vitest";
import flashElectoral from "@/data/2026/flash-electoral.json";
import onpeTerritorial from "@/data/2026/onpe-territorial-snapshot.json";
import {
  CANONICAL_SOURCE_TYPES,
  canonicalizeFlashSource,
  canonicalizeOnpeSnapshot,
} from "./source-metadata";

describe("dataset source metadata", () => {
  it("normaliza cada fuente del flash electoral a la taxonomía canónica", () => {
    for (const source of flashElectoral.sources) {
      const canonical = canonicalizeFlashSource(source);

      expect(canonical.source_url).toMatch(/^https:\/\//);
      expect(Date.parse(canonical.retrieved_at)).not.toBeNaN();
      expect(CANONICAL_SOURCE_TYPES.has(canonical.source_type)).toBe(true);
    }
  });

  it("preserva la separación entre resultado oficial y estimaciones privadas", () => {
    const byId = Object.fromEntries(
      flashElectoral.sources.map((source) => [
        source.id,
        canonicalizeFlashSource(source).source_type,
      ]),
    );

    expect(byId["onpe-parcial"]).toBe("official_result");
    expect(byId["onpe-parcial-prev"]).toBe("official_result");
    expect(byId["ipsos-boca"]).toBe("simulation");
    expect(byId["datum-boca"]).toBe("simulation");
    expect(byId["ipsos-cr"]).toBe("derived_metric");
    expect(byId["datum-cr"]).toBe("derived_metric");
  });

  it("normaliza el snapshot territorial ONPE con timestamp auditable", () => {
    const canonical = canonicalizeOnpeSnapshot(onpeTerritorial);

    expect(canonical.source_url).toMatch(/^https:\/\//);
    expect(Date.parse(canonical.retrieved_at)).not.toBeNaN();
    expect(canonical.source_type).toBe("official_result");
    expect(onpeTerritorial.departments.length).toBeGreaterThan(20);
  });
});
