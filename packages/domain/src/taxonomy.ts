export const workerCategoryCodes = [
  "WAG",
  "PES",
  "HSE",
  "HAR",
  "CHL",
  "FOL",
  "CON",
  "HRS",
  "SAN",
  "DIS",
  "OTH",
] as const;

export type WorkerCategoryCode = (typeof workerCategoryCodes)[number];

export const subcategoryCodes = [
  "WAG-UNP",
  "WAG-DEL",
  "WAG-UND",
  "WAG-DED",
  "WAG-PIE",
  "WAG-OVT",
  "WAG-OTH",
  "PES-EXP",
  "PES-REI",
  "PES-PPE",
  "PES-SYM",
  "PES-INF",
  "PES-OTH",
  "HSE-INJ",
  "HSE-HEA",
  "HSE-EQP",
  "HSE-TRN",
  "HSE-MED",
  "HSE-OTH",
  "HAR-VER",
  "HAR-SEX",
  "HAR-INT",
  "HAR-RET",
  "HAR-OTH",
  "CHL-WRK",
  "CHL-HAZ",
  "CHL-HRS",
  "CHL-OTH",
  "FOL-FOR",
  "FOL-DEB",
  "FOL-MOV",
  "FOL-THR",
  "FOL-DOC",
  "FOL-OTH",
  "CON-PAY",
  "CON-ABU",
  "CON-FEE",
  "CON-MIS",
  "CON-CON",
  "CON-OTH",
  "HRS-EXC",
  "HRS-RST",
  "HRS-FOT",
  "HRS-OTH",
  "SAN-WAT",
  "SAN-TLT",
  "SAN-WAS",
  "SAN-WOM",
  "SAN-OTH",
  "DIS-GEN",
  "DIS-ETH",
  "DIS-MIG",
  "DIS-AGE",
  "DIS-OTH",
] as const;

export type SubcategoryCode = (typeof subcategoryCodes)[number];

export const subcategoriesByCategory: Record<WorkerCategoryCode, readonly SubcategoryCode[]> = {
  WAG: ["WAG-UNP", "WAG-DEL", "WAG-UND", "WAG-DED", "WAG-PIE", "WAG-OVT", "WAG-OTH"],
  PES: ["PES-EXP", "PES-REI", "PES-PPE", "PES-SYM", "PES-INF", "PES-OTH"],
  HSE: ["HSE-INJ", "HSE-HEA", "HSE-EQP", "HSE-TRN", "HSE-MED", "HSE-OTH"],
  HAR: ["HAR-VER", "HAR-SEX", "HAR-INT", "HAR-RET", "HAR-OTH"],
  CHL: ["CHL-WRK", "CHL-HAZ", "CHL-HRS", "CHL-OTH"],
  FOL: ["FOL-FOR", "FOL-DEB", "FOL-MOV", "FOL-THR", "FOL-DOC", "FOL-OTH"],
  CON: ["CON-PAY", "CON-ABU", "CON-FEE", "CON-MIS", "CON-CON", "CON-OTH"],
  HRS: ["HRS-EXC", "HRS-RST", "HRS-FOT", "HRS-OTH"],
  SAN: ["SAN-WAT", "SAN-TLT", "SAN-WAS", "SAN-WOM", "SAN-OTH"],
  DIS: ["DIS-GEN", "DIS-ETH", "DIS-MIG", "DIS-AGE", "DIS-OTH"],
  OTH: [],
};

export const reporterTypes = [
  "self",
  "coworker",
  "family",
  "puwf-field",
  "community",
  "other",
] as const;
export type ReporterType = (typeof reporterTypes)[number];

export const employmentTypes = [
  "seasonal-picker",
  "daily-wage",
  "piece-rate",
  "migrant",
  "contractor",
  "tenant-associated",
  "other",
] as const;
export type EmploymentType = (typeof employmentTypes)[number];

export const groupImpact = [
  "individual",
  "2-5",
  "6-20",
  "more-than-20",
  "not-sure",
] as const;
export type GroupImpact = (typeof groupImpact)[number];

export const genders = ["Female", "Male", "Other", "Not Stated"] as const;
export type Gender = (typeof genders)[number];
