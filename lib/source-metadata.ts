type LegacySourceType = "oficial" | "encuesta" | "muestra";

export type CanonicalSourceType =
  | "official_result"
  | "official_registry"
  | "official_legal"
  | "derived_metric"
  | "simulation";

export type CanonicalSourceMetadata = {
  source_url: string;
  retrieved_at: string;
  source_type: CanonicalSourceType;
};

export const CANONICAL_SOURCE_TYPES = new Set<CanonicalSourceType>([
  "official_result",
  "official_registry",
  "official_legal",
  "derived_metric",
  "simulation",
]);

const FLASH_SOURCE_TYPE_MAP: Record<LegacySourceType, CanonicalSourceType> = {
  oficial: "official_result",
  encuesta: "simulation",
  muestra: "derived_metric",
};

export function canonicalizeFlashSource(source: {
  type: string;
  url: string;
  publishedAt: string;
}): CanonicalSourceMetadata {
  const sourceType = FLASH_SOURCE_TYPE_MAP[source.type as LegacySourceType];

  if (!sourceType) {
    throw new Error(`Unknown flash source type: ${source.type}`);
  }

  return {
    source_url: source.url,
    retrieved_at: source.publishedAt,
    source_type: sourceType,
  };
}

export function canonicalizeOnpeSnapshot(snapshot: {
  source: string;
  source_url?: string;
  retrieved_at?: string;
  source_type?: string;
  timestamp: string;
  status: string;
}): CanonicalSourceMetadata {
  const sourceType = snapshot.source_type ?? (
    snapshot.status === "snapshot" ? "official_result" : "derived_metric"
  );

  if (!CANONICAL_SOURCE_TYPES.has(sourceType as CanonicalSourceType)) {
    throw new Error(`Unknown snapshot source type: ${sourceType}`);
  }

  return {
    source_url: snapshot.source_url ?? snapshot.source,
    retrieved_at: snapshot.retrieved_at ?? snapshot.timestamp,
    source_type: sourceType as CanonicalSourceType,
  };
}
