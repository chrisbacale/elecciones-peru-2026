export const CANDIDATE_COLORS = {
  keiko: "var(--keiko)",
  keikoMuted: "#fdba74",
  sanchez: "var(--sanchez)",
  sanchezMuted: "#a78bfa",
  neutral: "#334155",
  neutralMuted: "#475569",
} as const;

export type DepartmentSlug =
  | "amazonas"
  | "ancash"
  | "apurimac"
  | "arequipa"
  | "ayacucho"
  | "cajamarca"
  | "callao"
  | "cusco"
  | "huancavelica"
  | "huanuco"
  | "ica"
  | "junin"
  | "la-libertad"
  | "lambayeque"
  | "lima"
  | "loreto"
  | "madre-de-dios"
  | "moquegua"
  | "pasco"
  | "piura"
  | "puno"
  | "san-martin"
  | "tacna"
  | "tumbes"
  | "ucayali";

export type DepartmentMeta = {
  slug: DepartmentSlug;
  code: string;
  name: string;
  path: string;
  labelX: number;
  labelY: number;
};

/** ONPE ubigeo nivel 01 → metadatos del mapa simplificado */
export const DEPARTMENTS: DepartmentMeta[] = [
  {
    slug: "tumbes",
    code: "230000",
    name: "Tumbes",
    path: "M48,8 L62,6 L68,14 L64,22 L50,20 Z",
    labelX: 58,
    labelY: 14,
  },
  {
    slug: "piura",
    code: "190000",
    name: "Piura",
    path: "M62,6 L88,8 L96,18 L92,28 L70,26 L64,22 Z",
    labelX: 80,
    labelY: 18,
  },
  {
    slug: "lambayeque",
    code: "130000",
    name: "Lambayeque",
    path: "M70,26 L92,28 L94,38 L78,42 L68,36 Z",
    labelX: 82,
    labelY: 34,
  },
  {
    slug: "la-libertad",
    code: "120000",
    name: "La Libertad",
    path: "M68,36 L94,38 L98,50 L82,56 L66,48 Z",
    labelX: 84,
    labelY: 46,
  },
  {
    slug: "cajamarca",
    code: "060000",
    name: "Cajamarca",
    path: "M66,48 L98,50 L102,64 L88,72 L72,66 L64,58 Z",
    labelX: 84,
    labelY: 60,
  },
  {
    slug: "amazonas",
    code: "010000",
    name: "Amazonas",
    path: "M88,72 L102,64 L110,76 L104,88 L90,84 Z",
    labelX: 98,
    labelY: 78,
  },
  {
    slug: "san-martin",
    code: "210000",
    name: "San Martín",
    path: "M90,84 L104,88 L108,102 L96,108 L84,98 Z",
    labelX: 96,
    labelY: 96,
  },
  {
    slug: "loreto",
    code: "150000",
    name: "Loreto",
    path: "M84,98 L108,102 L120,118 L118,148 L102,162 L88,150 L78,128 L80,110 Z",
    labelX: 100,
    labelY: 130,
  },
  {
    slug: "ancash",
    code: "020000",
    name: "Áncash",
    path: "M50,20 L64,22 L68,36 L58,44 L46,38 L44,28 Z",
    labelX: 56,
    labelY: 32,
  },
  {
    slug: "huanuco",
    code: "090000",
    name: "Huánuco",
    path: "M58,44 L82,56 L84,68 L72,74 L58,66 L52,54 Z",
    labelX: 68,
    labelY: 58,
  },
  {
    slug: "pasco",
    code: "180000",
    name: "Pasco",
    path: "M72,66 L88,72 L90,84 L78,88 L66,80 L64,74 Z",
    labelX: 78,
    labelY: 76,
  },
  {
    slug: "ucayali",
    code: "250000",
    name: "Ucayali",
    path: "M78,128 L102,162 L96,178 L82,172 L74,150 Z",
    labelX: 88,
    labelY: 158,
  },
  {
    slug: "lima",
    code: "140000",
    name: "Lima",
    path: "M44,28 L58,44 L52,54 L40,52 L36,40 Z",
    labelX: 46,
    labelY: 42,
  },
  {
    slug: "callao",
    code: "240000",
    name: "Callao",
    path: "M36,40 L40,52 L34,56 L30,48 Z",
    labelX: 34,
    labelY: 48,
  },
  {
    slug: "junin",
    code: "110000",
    name: "Junín",
    path: "M52,54 L72,74 L68,88 L54,86 L48,68 Z",
    labelX: 60,
    labelY: 72,
  },
  {
    slug: "huancavelica",
    code: "080000",
    name: "Huancavelica",
    path: "M48,68 L68,88 L62,98 L50,94 L44,78 Z",
    labelX: 56,
    labelY: 84,
  },
  {
    slug: "ica",
    code: "100000",
    name: "Ica",
    path: "M40,52 L52,54 L48,68 L38,72 L32,62 Z",
    labelX: 42,
    labelY: 62,
  },
  {
    slug: "ayacucho",
    code: "050000",
    name: "Ayacucho",
    path: "M50,94 L62,98 L64,112 L54,118 L44,106 Z",
    labelX: 54,
    labelY: 106,
  },
  {
    slug: "apurimac",
    code: "030000",
    name: "Apurímac",
    path: "M54,118 L64,112 L72,124 L66,136 L54,132 Z",
    labelX: 62,
    labelY: 124,
  },
  {
    slug: "cusco",
    code: "070000",
    name: "Cusco",
    path: "M66,136 L72,124 L88,128 L92,142 L78,152 L64,148 Z",
    labelX: 78,
    labelY: 138,
  },
  {
    slug: "madre-de-dios",
    code: "160000",
    name: "Madre de Dios",
    path: "M92,142 L104,148 L100,168 L88,164 L84,152 Z",
    labelX: 94,
    labelY: 156,
  },
  {
    slug: "arequipa",
    code: "040000",
    name: "Arequipa",
    path: "M38,72 L50,94 L44,106 L32,100 L28,84 Z",
    labelX: 38,
    labelY: 90,
  },
  {
    slug: "moquegua",
    code: "170000",
    name: "Moquegua",
    path: "M28,84 L32,100 L26,108 L20,96 Z",
    labelX: 26,
    labelY: 96,
  },
  {
    slug: "tacna",
    code: "220000",
    name: "Tacna",
    path: "M20,96 L26,108 L22,118 L14,110 L16,100 Z",
    labelX: 20,
    labelY: 108,
  },
  {
    slug: "puno",
    code: "200000",
    name: "Puno",
    path: "M64,148 L78,152 L76,168 L58,172 L52,158 Z",
    labelX: 66,
    labelY: 160,
  },
];

export const DEPARTMENT_BY_CODE = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.code, d])
) as Record<string, DepartmentMeta>;

export const DEPARTMENT_BY_SLUG = Object.fromEntries(
  DEPARTMENTS.map((d) => [d.slug, d])
) as Record<DepartmentSlug, DepartmentMeta>;

export const REGION_BREAKDOWN_ORDER = [
  { key: "lima", label: "Lima" },
  { key: "interior", label: "Regiones" },
  { key: "urbano", label: "Urbano" },
  { key: "rural", label: "Rural" },
  { key: "costa", label: "Costa" },
  { key: "sierra", label: "Sierra" },
  { key: "selva", label: "Selva" },
  { key: "sur", label: "Sur" },
  { key: "norte", label: "Norte" },
  { key: "centro", label: "Centro" },
  { key: "oriente", label: "Oriente" },
] as const;
