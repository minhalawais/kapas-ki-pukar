import type { RuntimeConfig } from "@kapas/config";
import fastifyHttpProxy from "@fastify/http-proxy";

type FastifyRegisterHost = {
  register: (plugin: unknown, opts?: unknown) => Promise<unknown>;
};

function rewriteLocation(
  location: string,
  internal: URL,
  publicBase: URL,
): string {
  try {
    const resolved = new URL(location, internal);
    if (!resolved.pathname.startsWith("/files")) return location;
    const next = new URL(resolved.pathname + resolved.search, publicBase);
    return next.toString();
  } catch {
    if (location.startsWith("/files")) {
      return new URL(location, publicBase).toString();
    }
    return location;
  }
}

/** Expose tusd through the API port so mobile clients only need one reachable host. */
export async function registerTusdProxy(
  fastify: FastifyRegisterHost,
  config: RuntimeConfig,
): Promise<void> {
  const internal = new URL(config.tusdInternalUrl);
  const publicBase = new URL(config.tusdPublicUrl);
  const upstream = `${internal.protocol}//${internal.host}`;

  await fastify.register(fastifyHttpProxy, {
    upstream,
    prefix: "/files",
    rewritePrefix: internal.pathname.replace(/\/$/u, "") || "/files",
    http2: false,
    replyOptions: {
      rewriteRequestHeaders: (
        _request: unknown,
        headers: Record<string, string | string[] | undefined>,
      ) => ({
        ...headers,
        "x-forwarded-host": publicBase.host,
        "x-forwarded-proto": publicBase.protocol.replace(":", ""),
      }),
      rewriteHeaders(headers: Record<string, string | string[] | undefined>) {
        const next = { ...headers };
        const location = next.location;
        if (typeof location === "string") {
          next.location = rewriteLocation(location, internal, publicBase);
        }
        return next;
      },
    },
  });
}
