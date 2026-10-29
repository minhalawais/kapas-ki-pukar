import { createHmac, timingSafeEqual } from "node:crypto";

import type { RuntimeConfig } from "@kapas/config";
import type { DatabaseClient } from "@kapas/database";
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Inject,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { DATABASE_CLIENT, RUNTIME_CONFIG } from "./tokens";

export function verifyProviderWebhookSignature(
  secret: string,
  signature: string,
  timestamp: string,
  raw: Buffer,
  now = Date.now(),
): boolean {
  const timestampNumber = Number(timestamp);
  if (!Number.isFinite(timestampNumber) || Math.abs(now - timestampNumber * 1_000) > 5 * 60_000)
    return false;
  const expected = createHmac("sha256", secret)
    .update(`${timestamp}.${raw.toString("utf8")}`)
    .digest("hex");
  const supplied = signature.replace(/^sha256=/, "");
  return (
    supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}

@Controller("api/v1/provider-webhooks")
export class ProviderWebhookController {
  public constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(RUNTIME_CONFIG) private readonly config: RuntimeConfig,
  ) {}

  @Post(":provider")
  @HttpCode(202)
  async receive(
    @Param("provider") provider: string,
    @Headers("x-provider-signature") signature: string | undefined,
    @Headers("x-provider-timestamp") timestamp: string | undefined,
    @Headers("x-provider-event-id") providerId: string | undefined,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ): Promise<{ accepted: true }> {
    const raw =
      (request as FastifyRequest & { rawBody?: Buffer }).rawBody ??
      Buffer.from(JSON.stringify(body));
    if (!raw || !signature || !timestamp || !providerId || !this.config.providerWebhookSecret) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    if (
      !verifyProviderWebhookSignature(this.config.providerWebhookSecret, signature, timestamp, raw)
    ) {
      throw new UnauthorizedException("Invalid webhook signature");
    }
    try {
      await this.client.providerWebhookEvent.create({
        data: {
          provider: provider.slice(0, 50),
          providerId: providerId.slice(0, 160),
          eventType:
            typeof body === "object" && body !== null && "type" in body
              ? String((body as { type: unknown }).type).slice(0, 100)
              : "provider.event",
        },
      });
    } catch (error) {
      if (!(error && typeof error === "object" && "code" in error && error.code === "P2002"))
        throw error;
    }
    return { accepted: true };
  }
}
