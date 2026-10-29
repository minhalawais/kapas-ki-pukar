import { z } from "zod";

const booleanStringSchema = z.enum(["true", "false"]).transform((value) => value === "true");

const logLevelSchema = z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]);

const environmentSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]),
    APP_VERSION: z.string().trim().min(1).max(100),
    API_HOST: z.string().trim().min(1).default("127.0.0.1"),
    API_PORT: z.coerce.number().int().min(1).max(65_535),
    PUBLIC_API_URL: z.url(),
    PORTAL_ORIGIN: z.string().trim().min(1),
    DATABASE_URL: z.string().trim().startsWith("postgresql://"),
    REDIS_URL: z.string().trim().startsWith("redis://"),
    LOG_LEVEL: logLevelSchema,
    TRUST_PROXY_COUNT: z.coerce.number().int().min(0).max(10),
    EVIDENCE_ROOT: z.string().trim().min(1),
    QUARANTINE_ROOT: z.string().trim().min(1),
    CLAMAV_HOST: z.string().trim().min(1).default("127.0.0.1"),
    CLAMAV_PORT: z.coerce.number().int().min(1).max(65_535).default(3310),
    ENCRYPTION_KEY_ID: z.string().trim().min(1).max(200),
    SESSION_SECRET: z.string().min(32),
    IDENTITY_LOOKUP_PEPPER: z.string().min(32),
    INTERNAL_METRICS_TOKEN: z.string().min(24),
    PROVIDER_WEBHOOK_SECRET: z.string().min(32).optional().default(""),
    TUSD_HOOK_SECRET: z.string().min(32).default("development-only-tusd-hook-secret-32"),
    TUSD_PUBLIC_URL: z.url().optional(),
    TUSD_INTERNAL_URL: z.url().default("http://127.0.0.1:1080/files/"),
    OBJECT_STORE_ENDPOINT: z.url().default("http://127.0.0.1:9000"),
    OBJECT_STORE_ACCESS_KEY: z.string().min(1).default("kapas-local"),
    OBJECT_STORE_SECRET_KEY: z.string().min(8).default("development-minio-secret"),
    QUARANTINE_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,62}$/)
      .default("quarantine"),
    PROTECTED_EVIDENCE_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,62}$/)
      .default("protected-evidence"),
    TEMPORARY_BUCKET: z
      .string()
      .regex(/^[a-z0-9][a-z0-9.-]{1,62}$/)
      .default("temporary"),
    EVIDENCE_KEK_SECRET: z.string().min(32).default("development-only-evidence-kek-secret"),
    EXPO_PUSH_ENABLED: booleanStringSchema.default(false),
    EXPO_PUSH_ACCESS_TOKEN: z.string().trim().optional().default(""),
    OPENAPI_ENABLED: booleanStringSchema.default(false),
    JSON_BODY_LIMIT_BYTES: z.coerce
      .number()
      .int()
      .min(1_024)
      .max(5 * 1_024 * 1_024)
      .default(1_048_576),
    RATE_LIMIT_TTL_MS: z.coerce.number().int().min(1_000).max(3_600_000).default(60_000),
    RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(120),
    WORKER_CONCURRENCY: z.coerce.number().int().min(1).max(32).default(2),
    WORKER_HEALTH_PORT: z.coerce.number().int().min(1).max(65_535).default(4100),
    QUEUE_PREFIX: z
      .string()
      .trim()
      .regex(/^[a-z0-9][a-z0-9_-]{1,62}$/i),
    SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(60_000).default(10_000),
  })
  .superRefine((value, context) => {
    const origins = value.PORTAL_ORIGIN.split(",").map((origin) => origin.trim());

    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (!parsed.protocol.startsWith("http") || parsed.origin !== origin) {
          throw new Error("invalid origin");
        }
      } catch {
        context.addIssue({
          code: "custom",
          path: ["PORTAL_ORIGIN"],
          message: "must contain only comma-separated HTTP(S) origins without paths",
        });
      }
    }

    if (value.NODE_ENV === "production") {
      if (value.TUSD_HOOK_SECRET === "development-only-tusd-hook-secret-32") {
        context.addIssue({
          code: "custom",
          path: ["TUSD_HOOK_SECRET"],
          message: "must be replaced in production",
        });
      }
      if (value.EVIDENCE_KEK_SECRET === "development-only-evidence-kek-secret") {
        context.addIssue({
          code: "custom",
          path: ["EVIDENCE_KEK_SECRET"],
          message: "must be replaced in production",
        });
      }
      if (value.API_HOST !== "0.0.0.0") {
        context.addIssue({
          code: "custom",
          path: ["API_HOST"],
          message: "must be 0.0.0.0 in production containers",
        });
      }
      if (origins.includes("*")) {
        context.addIssue({
          code: "custom",
          path: ["PORTAL_ORIGIN"],
          message: "wildcard CORS is prohibited in production",
        });
      }
      if (value.OPENAPI_ENABLED) {
        context.addIssue({
          code: "custom",
          path: ["OPENAPI_ENABLED"],
          message: "public OpenAPI endpoints must be disabled in production",
        });
      }
    }
  });

export type RuntimeConfig = Readonly<{
  nodeEnv: "development" | "test" | "production";
  appVersion: string;
  apiHost: string;
  apiPort: number;
  publicApiUrl: string;
  portalOrigins: readonly string[];
  databaseUrl: string;
  redisUrl: string;
  logLevel: z.infer<typeof logLevelSchema>;
  trustProxyCount: number;
  evidenceRoot: string;
  quarantineRoot: string;
  clamavHost: string;
  clamavPort: number;
  encryptionKeyId: string;
  sessionSecret: string;
  identityLookupPepper: string;
  internalMetricsToken: string;
  providerWebhookSecret: string;
  tusdHookSecret: string;
  tusdPublicUrl: string;
  tusdInternalUrl: string;
  objectStoreEndpoint: string;
  objectStoreAccessKey: string;
  objectStoreSecretKey: string;
  quarantineBucket: string;
  protectedEvidenceBucket: string;
  temporaryBucket: string;
  evidenceKekSecret: string;
  expoPushEnabled: boolean;
  expoPushAccessToken: string;
  openApiEnabled: boolean;
  jsonBodyLimitBytes: number;
  rateLimitTtlMs: number;
  rateLimitMax: number;
  workerConcurrency: number;
  workerHealthPort: number;
  queuePrefix: string;
  shutdownTimeoutMs: number;
}>;

export class ConfigurationError extends Error {
  public readonly invalidKeys: readonly string[];

  public constructor(invalidKeys: readonly string[]) {
    super(`Invalid runtime configuration keys: ${invalidKeys.join(", ")}`);
    this.name = "ConfigurationError";
    this.invalidKeys = invalidKeys;
  }
}

export function loadRuntimeConfig(source: NodeJS.ProcessEnv): RuntimeConfig {
  const parsed = environmentSchema.safeParse(source);
  if (!parsed.success) {
    const invalidKeys = [
      ...new Set(parsed.error.issues.map((issue) => String(issue.path[0] ?? "environment"))),
    ].sort();
    throw new ConfigurationError(invalidKeys);
  }

  return Object.freeze({
    nodeEnv: parsed.data.NODE_ENV,
    appVersion: parsed.data.APP_VERSION,
    apiHost: parsed.data.API_HOST,
    apiPort: parsed.data.API_PORT,
    publicApiUrl: parsed.data.PUBLIC_API_URL,
    portalOrigins: Object.freeze(
      parsed.data.PORTAL_ORIGIN.split(",").map((origin) => origin.trim()),
    ),
    databaseUrl: parsed.data.DATABASE_URL,
    redisUrl: parsed.data.REDIS_URL,
    logLevel: parsed.data.LOG_LEVEL,
    trustProxyCount: parsed.data.TRUST_PROXY_COUNT,
    evidenceRoot: parsed.data.EVIDENCE_ROOT,
    quarantineRoot: parsed.data.QUARANTINE_ROOT,
    clamavHost: parsed.data.CLAMAV_HOST,
    clamavPort: parsed.data.CLAMAV_PORT,
    encryptionKeyId: parsed.data.ENCRYPTION_KEY_ID,
    sessionSecret: parsed.data.SESSION_SECRET,
    identityLookupPepper: parsed.data.IDENTITY_LOOKUP_PEPPER,
    internalMetricsToken: parsed.data.INTERNAL_METRICS_TOKEN,
    providerWebhookSecret: parsed.data.PROVIDER_WEBHOOK_SECRET,
    tusdHookSecret: parsed.data.TUSD_HOOK_SECRET,
    tusdPublicUrl:
      parsed.data.TUSD_PUBLIC_URL ?? `${parsed.data.PUBLIC_API_URL.replace(/\/$/u, "")}/files/`,
    tusdInternalUrl: parsed.data.TUSD_INTERNAL_URL,
    objectStoreEndpoint: parsed.data.OBJECT_STORE_ENDPOINT,
    objectStoreAccessKey: parsed.data.OBJECT_STORE_ACCESS_KEY,
    objectStoreSecretKey: parsed.data.OBJECT_STORE_SECRET_KEY,
    quarantineBucket: parsed.data.QUARANTINE_BUCKET,
    protectedEvidenceBucket: parsed.data.PROTECTED_EVIDENCE_BUCKET,
    temporaryBucket: parsed.data.TEMPORARY_BUCKET,
    evidenceKekSecret: parsed.data.EVIDENCE_KEK_SECRET,
    expoPushEnabled: parsed.data.EXPO_PUSH_ENABLED,
    expoPushAccessToken: parsed.data.EXPO_PUSH_ACCESS_TOKEN,
    openApiEnabled: parsed.data.OPENAPI_ENABLED,
    jsonBodyLimitBytes: parsed.data.JSON_BODY_LIMIT_BYTES,
    rateLimitTtlMs: parsed.data.RATE_LIMIT_TTL_MS,
    rateLimitMax: parsed.data.RATE_LIMIT_MAX,
    workerConcurrency: parsed.data.WORKER_CONCURRENCY,
    workerHealthPort: parsed.data.WORKER_HEALTH_PORT,
    queuePrefix: parsed.data.QUEUE_PREFIX,
    shutdownTimeoutMs: parsed.data.SHUTDOWN_TIMEOUT_MS,
  });
}

export function loadRuntimeConfigFromProcess(): RuntimeConfig {
  return loadRuntimeConfig(process.env);
}

export function configDiagnostics(
  config: RuntimeConfig,
): Readonly<Record<string, string | number | boolean>> {
  return Object.freeze({
    NODE_ENV: config.nodeEnv,
    APP_VERSION: config.appVersion,
    API_HOST: config.apiHost,
    API_PORT: config.apiPort,
    PUBLIC_API_URL: "valid",
    PORTAL_ORIGIN: `${config.portalOrigins.length} configured`,
    DATABASE_URL: "valid",
    REDIS_URL: "valid",
    LOG_LEVEL: config.logLevel,
    TRUST_PROXY_COUNT: config.trustProxyCount,
    EVIDENCE_ROOT: "configured",
    QUARANTINE_ROOT: "configured",
    CLAMAV_HOST: config.clamavHost,
    CLAMAV_PORT: config.clamavPort,
    ENCRYPTION_KEY_ID: "configured",
    SESSION_SECRET: "configured",
    IDENTITY_LOOKUP_PEPPER: "configured",
    INTERNAL_METRICS_TOKEN: "configured",
    TUSD_HOOK_SECRET: "configured",
    TUSD_PUBLIC_URL: "configured",
    TUSD_INTERNAL_URL: "configured",
    OBJECT_STORE_ENDPOINT: "configured",
    OBJECT_STORE_ACCESS_KEY: "configured",
    OBJECT_STORE_SECRET_KEY: "configured",
    EVIDENCE_KEK_SECRET: "configured",
    EXPO_PUSH_ENABLED: config.expoPushEnabled,
    OPENAPI_ENABLED: config.openApiEnabled,
  });
}
