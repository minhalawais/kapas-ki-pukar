const sensitiveKeyPattern =
  /authorization|cookie|password|secret|token|session|cnic|phone|contact|coordinate|transcript|evidence|database.?url|redis.?url/i;

export const pinoRedactionPaths = Object.freeze([
  "req.headers.authorization",
  "req.headers.cookie",
  "req.body",
  "res.headers.set-cookie",
  "config.databaseUrl",
  "config.redisUrl",
  "config.sessionSecret",
  "config.internalMetricsToken",
  "job.data",
]);

export function redactUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(redactUnknown);
  }
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, nested]) => [
        key,
        sensitiveKeyPattern.test(key) ? "[REDACTED]" : redactUnknown(nested),
      ]),
    );
  }
  return value;
}

export function assertSafeDestructiveEnvironment(nodeEnv: string, databaseUrl: string): void {
  if (nodeEnv === "production") {
    throw new Error("Destructive database utilities are disabled in production");
  }

  const databaseName = new URL(databaseUrl).pathname.replace(/^\//, "");
  if (!databaseName.endsWith("_test")) {
    throw new Error("Destructive database utilities require a database name ending in _test");
  }
}
