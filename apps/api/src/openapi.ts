import type { RuntimeConfig } from "@kapas/config";
import type { NestFastifyApplication } from "@nestjs/platform-fastify";
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from "@nestjs/swagger";

export function createOpenApiDocument(
  app: NestFastifyApplication,
  config: RuntimeConfig,
): OpenAPIObject {
  const definition = new DocumentBuilder()
    .setTitle("Kapas ki Pukaar API")
    .setDescription("Production backend foundation API")
    .setVersion(config.appVersion)
    .build();

  return SwaggerModule.createDocument(app, definition, {
    operationIdFactory: (controllerKey, methodKey) => `${controllerKey}_${methodKey}`,
  });
}

export function stableJson(value: unknown): string {
  const normalize = (input: unknown): unknown => {
    if (Array.isArray(input)) {
      return input.map(normalize);
    }
    if (input !== null && typeof input === "object") {
      return Object.fromEntries(
        Object.entries(input)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([key, nested]) => [key, normalize(nested)]),
      );
    }
    return input;
  };
  return `${JSON.stringify(normalize(value), null, 2)}\n`;
}
