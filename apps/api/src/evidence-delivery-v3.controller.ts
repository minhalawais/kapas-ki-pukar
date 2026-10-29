import { Body, Controller, Get, Headers, Inject, Param, Post, Req } from "@nestjs/common";
import { ApiHeader, ApiParam, ApiTags } from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { EvidenceDeliveryV3Service } from "./evidence-delivery-v3.service";

@Controller("api/v3/complaints/:reference")
@ApiTags("Evidence Delivery V3")
@ApiParam({ name: "reference" })
@ApiHeader({ name: "X-Tracking-Secret", required: true })
export class EvidenceDeliveryV3Controller {
  constructor(
    @Inject(EvidenceDeliveryV3Service)
    private readonly deliveryService: EvidenceDeliveryV3Service,
  ) {}

  @Get("delivery")
  delivery(
    @Param("reference") reference: string,
    @Headers("x-tracking-secret") trackingSecret: string | undefined,
  ) {
    return this.deliveryService.delivery(reference, trackingSecret);
  }

  @Post("evidence/:clientMediaId/grant")
  grant(
    @Param("reference") reference: string,
    @Param("clientMediaId") clientMediaId: string,
    @Headers("x-tracking-secret") trackingSecret: string | undefined,
  ) {
    return this.deliveryService.grant(reference, clientMediaId, trackingSecret);
  }

  @Post("evidence/:clientMediaId/omit")
  omit(
    @Param("reference") reference: string,
    @Param("clientMediaId") clientMediaId: string,
    @Headers("x-tracking-secret") trackingSecret: string | undefined,
    @Req() request: FastifyRequest,
  ) {
    return this.deliveryService.omit(reference, clientMediaId, trackingSecret, request.id);
  }

  @Post("evidence")
  replace(
    @Param("reference") reference: string,
    @Headers("x-tracking-secret") trackingSecret: string | undefined,
    @Headers("x-replacement-for") replacementForId: string,
    @Body() body: unknown,
    @Req() request: FastifyRequest,
  ) {
    return this.deliveryService.replace(
      reference,
      replacementForId,
      body,
      trackingSecret,
      request.id,
    );
  }
}
