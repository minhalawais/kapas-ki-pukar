import { contractJsonSchemas, type IntakeReceiptV3 } from "@kapas/api-contracts";
import { Body, Controller, Get, Headers, Inject, Param, Post, Req } from "@nestjs/common";
import {
  ApiBody,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import type { FastifyRequest } from "fastify";

import { ComplaintIntakeV3Service } from "./complaint-intake-v3.service";

@Controller("api/v3/intake-submissions")
@ApiTags("Complaint Intake V3")
export class ComplaintIntakeV3Controller {
  constructor(
    @Inject(ComplaintIntakeV3Service) private readonly intake: ComplaintIntakeV3Service,
  ) {}

  @Post()
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiBody({ schema: contractJsonSchemas.IntakeSubmissionV3 as never })
  @ApiCreatedResponse({ schema: contractJsonSchemas.IntakeReceiptV3 as never })
  submit(
    @Body() body: unknown,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
    @Req() request: FastifyRequest,
  ): Promise<IntakeReceiptV3> {
    return this.intake.submit(body, idempotencyKey, request.id);
  }

  @Get(":clientSubmissionId")
  @ApiHeader({ name: "Idempotency-Key", required: true })
  @ApiParam({ name: "clientSubmissionId", format: "uuid" })
  @ApiOkResponse({ schema: contractJsonSchemas.IntakeReceiptV3 as never })
  recover(
    @Param("clientSubmissionId") clientSubmissionId: string,
    @Headers("idempotency-key") idempotencyKey: string | undefined,
  ): Promise<IntakeReceiptV3> {
    return this.intake.recover(clientSubmissionId, idempotencyKey);
  }
}
