import { PostgresComplaintRepository, type DatabaseClient, type Prisma } from "@kapas/database";
import { assertCaseTransition, canTransitionCase, type CaseStatus } from "@kapas/domain";
import {
  caseClosureInputSchema,
  caseFactInputSchema,
  caseOutcomeInputSchema,
  correctiveActionInputSchema,
  correctiveActionUpdateSchema,
  findingInputSchema,
  referralInputSchema,
  triageInputSchema,
  workerContactInputSchema,
} from "@kapas/validation";
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Get,
  Inject,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import type { FastifyRequest } from "fastify";

import { RequirePermission, StaffAuthorizationGuard } from "./authorization";
import { StaffCaseEvidenceService } from "./staff-case-evidence.service";
import { DATABASE_CLIENT } from "./tokens";

type StaffRequest = FastifyRequest & { user?: { userId: string } };

@Controller("api/v1/cases")
@UseGuards(StaffAuthorizationGuard)
@RequirePermission("case.read")
export class CaseWorkflowController {
  private readonly complaints: PostgresComplaintRepository;

  constructor(
    @Inject(DATABASE_CLIENT) private readonly client: DatabaseClient,
    @Inject(StaffCaseEvidenceService) private readonly staffEvidence: StaffCaseEvidenceService,
  ) {
    this.complaints = new PostgresComplaintRepository(client);
  }

  @Get(":id/workspace")
  async workspace(@Param("id") id: string) {
    const complaintId = await this.resolveCaseKey(id);
    const [complaint, history] = await Promise.all([
      this.client.complaint.findUnique({
        where: { id: complaintId },
        include: {
          triage: true,
          contacts: { orderBy: { occurredAt: "desc" } },
          caseFacts: { orderBy: { recordedAt: "desc" } },
          investigationFindings: { orderBy: { recordedAt: "desc" } },
          correctiveActions: { orderBy: { createdAt: "desc" } },
          externalReferrals: { orderBy: { referredAt: "desc" } },
          caseOutcomes: { orderBy: { recordedAt: "desc" } },
          closures: { orderBy: { closedAt: "desc" } },
          caseEvidenceLinks: { include: { evidence: true }, orderBy: { createdAt: "desc" } },
        },
      }),
      this.client.caseHistory.findMany({ where: { complaintId }, orderBy: { occurredAt: "asc" } }),
    ]);
    if (!complaint) throw new NotFoundException("Complaint not found");
    return { ...complaint, history, availableActions: this.actionsFor(complaint.status as CaseStatus) };
  }

  @Post(":id/triage")
  @RequirePermission("case.mutate")
  async triage(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(triageInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const assignedStaffId = input.assignedStaffId ?? actorId;
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      if (current.status !== "Triage") throw new BadRequestException("Case must be in Triage");
      assertCaseTransition("Triage", input.nextStatus);
      await tx.user.findUniqueOrThrow({ where: { id: assignedStaffId } });
      const version = current.version + 1;
      await tx.caseTriage.upsert({
        where: { complaintId },
        create: {
          complaintId,
          assignedStaffId,
          categoryCode: input.categoryCode,
          subcategoryCode: input.subcategoryCode,
          priority: input.priority,
          priorityReason: input.priorityReason,
          scope: input.scope,
          safetyRisk: input.safetyRisk,
          safeguardingRisk: input.safeguardingRisk,
          retaliationRisk: input.retaliationRisk,
          conflictOfInterest: input.conflictOfInterest,
          investigationRoute: input.investigationRoute,
          nextAction: input.nextAction,
          nextActionAt: new Date(input.nextActionAt),
          completedBy: actorId,
        },
        update: {
          assignedStaffId,
          categoryCode: input.categoryCode,
          subcategoryCode: input.subcategoryCode,
          priority: input.priority,
          priorityReason: input.priorityReason,
          scope: input.scope,
          safetyRisk: input.safetyRisk,
          safeguardingRisk: input.safeguardingRisk,
          retaliationRisk: input.retaliationRisk,
          conflictOfInterest: input.conflictOfInterest,
          investigationRoute: input.investigationRoute,
          nextAction: input.nextAction,
          nextActionAt: new Date(input.nextActionAt),
          completedBy: actorId,
          completedAt: new Date(),
        },
      });
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          assignedStaffId,
          categoryCode: input.categoryCode,
          subcategoryCode: input.subcategoryCode,
          priority: input.priority,
          status: input.nextStatus,
          nextUpdateDueAt: new Date(input.nextActionAt),
          dueAt: new Date(input.nextActionAt),
          version,
        },
      });
      await this.auditMutation(tx, {
        complaintId,
        requestId: input.requestId,
        actorId,
        actionType: "Triage Completed",
        auditAction: "case.triage.completed",
        fromStatus: current.status,
        toStatus: input.nextStatus,
        version,
        visibility: "worker-visible",
        reasonData: { nextAction: input.nextAction, priorityReason: input.priorityReason },
      });
      return { id: complaintId, version, status: input.nextStatus };
    });
  }

  @Post(":id/contacts")
  @RequirePermission("case.mutate")
  async contact(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(workerContactInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({
        where: { id: complaintId },
        include: { reporter: true, incident: true },
      });
      this.assertVersion(current.version, input.expectedVersion);
      this.assertCaseOpen(current.status);
      const preference = current.reporter?.contactPreference ?? (current.reporter?.contactAllowed ? "either" : "do-not-initiate");
      const channelAllowed =
        input.channel === "none" ||
        preference === "either" ||
        preference === input.channel ||
        (preference === "representative" && input.channel === "representative");
      const overrideAllowed =
        input.emergencyOverride && current.priority === "Emergency" && current.incident?.immediateDanger === true;
      if (!channelAllowed && !overrideAllowed) throw new BadRequestException("CONTACT_NOT_PERMITTED");
      if (input.emergencyOverride && !overrideAllowed) throw new BadRequestException("EMERGENCY_OVERRIDE_NOT_ALLOWED");
      const successful = ["connected", "representative-contacted"].includes(input.outcome);
      const verificationCompleteWithoutContact =
        input.outcome === "prohibited" &&
        (preference === "do-not-initiate" || input.channel === "none");
      const completesVerification = successful || verificationCompleteWithoutContact;
      const nextStatus = completesVerification ? "Investigation" : "Verification";
      if (completesVerification) assertCaseTransition("Verification", "Investigation");
      const version = current.version + 1;
      const contact = await tx.workerContact.create({
        data: {
          complaintId,
          channel: input.channel,
          outcome: input.outcome,
          occurredAt: new Date(input.occurredAt),
          staffActorId: actorId,
          language: input.language,
          safeContactConfirmed: input.safeContactConfirmed,
          emergencyOverride: input.emergencyOverride,
          overrideReason: input.overrideReason,
          representativeName: input.representativeName,
          additionalFacts: input.additionalFacts,
          requestedOutcome: input.requestedOutcome,
          readBackConfirmed: input.readBackConfirmed,
          followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined,
          summary: input.summary,
          visibility: input.visibility,
        },
      });
      if (input.additionalFacts?.trim()) {
        await tx.caseFact.create({
          data: {
            complaintId,
            workerContactId: contact.id,
            fact: input.additionalFacts.trim(),
            sourceType: input.channel === "representative" ? "witness" : "worker-call",
            sourceRecordId: contact.id,
            verificationState: input.readBackConfirmed ? "verified" : "reported",
            recordedBy: actorId,
          },
        });
      }
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: nextStatus,
          contactDueAt: input.followUpAt ? new Date(input.followUpAt) : current.contactDueAt,
          nextUpdateDueAt: input.followUpAt ? new Date(input.followUpAt) : current.nextUpdateDueAt,
          dueAt: input.followUpAt ? new Date(input.followUpAt) : current.dueAt,
          version,
        },
      });
      await this.auditMutation(tx, {
        complaintId,
        requestId: input.requestId,
        actorId,
        actionType: input.emergencyOverride
          ? "Emergency Contact Override"
          : successful
            ? "Contact Successful"
            : verificationCompleteWithoutContact
              ? "Contact Attempted"
              : "Contact Attempted",
        auditAction: input.emergencyOverride ? "case.contact.emergency_override" : "case.contact.recorded",
        fromStatus: completesVerification ? current.status : undefined,
        toStatus: completesVerification ? nextStatus : undefined,
        version,
        visibility: input.visibility,
        reasonData: {
          contactId: contact.id,
          outcome: input.outcome,
          summary: input.summary,
          simplifiedStage: "record-worker-contact",
        },
      });
      return { id: complaintId, contactId: contact.id, version, status: nextStatus };
    });
  }

  @Post(":id/verification/complete-without-contact")
  @RequirePermission("case.mutate")
  async completeVerificationWithoutContact(
    @Param("id") id: string,
    @Body() body: { expectedVersion?: number; requestId?: string },
    @Req() request: StaffRequest,
  ) {
    if (!Number.isInteger(body.expectedVersion) || !body.requestId || body.requestId.length < 8) {
      throw new BadRequestException("expectedVersion and requestId are required");
    }
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const expectedVersion = body.expectedVersion as number;
    const requestId = body.requestId as string;
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({
        where: { id: complaintId },
        include: { reporter: true },
      });
      this.assertVersion(current.version, expectedVersion);
      if (current.status !== "Verification") throw new BadRequestException("Case must be in Verification");
      const preference =
        current.reporter?.contactPreference ??
        (current.reporter?.contactAllowed ? "either" : "do-not-initiate");
      if (preference !== "do-not-initiate") {
        throw new BadRequestException("Worker contact preference does not allow skipping contact");
      }
      const documented = await tx.workerContact.findFirst({
        where: { complaintId, outcome: "prohibited" },
      });
      if (!documented) {
        throw new BadRequestException("Document no-contact on the case before proceeding");
      }
      assertCaseTransition("Verification", "Investigation");
      const version = current.version + 1;
      await tx.complaint.update({
        where: { id: complaintId },
        data: { status: "Investigation", version },
      });
      await this.auditMutation(tx, {
        complaintId,
        requestId,
        actorId,
        actionType: "Contact Attempted",
        auditAction: "case.verification.completed_without_contact",
        fromStatus: "Verification",
        toStatus: "Investigation",
        version,
        visibility: "internal",
        reasonData: { contactId: documented.id, outcome: "prohibited" },
      });
      return { id: complaintId, version, status: "Investigation" as const };
    });
  }

  @Post(":id/investigation/start")
  @RequirePermission("case.mutate")
  async startInvestigation(
    @Param("id") id: string,
    @Body() body: { expectedVersion?: number; requestId?: string; summary?: string },
    @Req() request: StaffRequest,
  ) {
    if (!Number.isInteger(body.expectedVersion) || !body.requestId || body.requestId.length < 8) {
      throw new BadRequestException("expectedVersion and requestId are required");
    }
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const summary = body.summary?.trim();
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, body.expectedVersion as number);
      this.assertCaseOpen(current.status);
      const version = current.version + 1;
      let nextStatus = current.status;
      if (["Received", "Reopened", "Triage", "Verification"].includes(current.status)) {
        assertCaseTransition(current.status as CaseStatus, "Investigation");
        nextStatus = "Investigation";
      }
      await tx.complaint.update({ where: { id: complaintId }, data: { status: nextStatus, version } });
      await this.auditMutation(tx, {
        complaintId,
        requestId: body.requestId as string,
        actorId,
        actionType: "Review Started",
        auditAction: "case.investigation.started",
        fromStatus: nextStatus !== current.status ? current.status : undefined,
        toStatus: nextStatus !== current.status ? nextStatus : undefined,
        version,
        visibility: "worker-visible",
        reasonData: {
          summary: summary ?? "Investigation started",
          simplifiedStage: "investigation-started",
        },
      });
      return { id: complaintId, version, status: nextStatus };
    });
  }

  @Post(":id/facts")
  @RequirePermission("case.mutate")
  async fact(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(caseFactInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      this.assertCaseOpen(current.status);
      const version = current.version + 1;
      const fact = await tx.caseFact.create({ data: {
        complaintId, workerContactId: input.workerContactId, fact: input.fact,
        structuredValue: input.structuredValue as never, sourceType: input.sourceType,
        sourceRecordId: input.sourceRecordId, verificationState: input.verificationState, recordedBy: actorId,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { version } });
      await this.auditMutation(tx, {
        complaintId,
        requestId: input.requestId,
        actorId,
        actionType: "Verified Fact Recorded",
        auditAction: "case.fact.recorded",
        version,
        visibility: "internal",
        reasonData: {
          factId: fact.id,
          summary: input.fact,
          sourceType: input.sourceType,
          simplifiedStage: "record-contact",
        },
      });
      return { id: complaintId, factId: fact.id, version };
    });
  }

  @Post(":id/findings")
  @RequirePermission("case.mutate")
  async finding(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(findingInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      this.assertCaseOpen(current.status);
      const version = current.version + 1;
      const finding = await tx.investigationFinding.create({ data: {
        complaintId, issue: input.issue, allegation: input.allegation, conclusion: input.conclusion,
        rationale: input.rationale, rootCause: input.rootCause, affectedScope: input.affectedScope,
        recommendedAction: input.recommendedAction, recordedBy: actorId,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { version } });
      await this.auditMutation(tx, {
        complaintId,
        requestId: input.requestId,
        actorId,
        actionType: "Investigation Finding Recorded",
        auditAction: "case.finding.recorded",
        version,
        visibility: "internal",
        reasonData: {
          findingId: finding.id,
          conclusion: input.conclusion,
          summary: input.rationale,
          simplifiedStage: "root-cause-analysis",
        },
      });
      return { id: complaintId, findingId: finding.id, version };
    });
  }

  @Post(":id/corrective-actions")
  @RequirePermission("case.mutate")
  async createAction(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(correctiveActionInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const ownerStaffId = input.ownerStaffId ?? actorId;
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      this.assertCaseOpen(current.status);
      let workingStatus = current.status as CaseStatus;
      if (!["Investigation", "Action in Progress"].includes(workingStatus)) {
        if (canTransitionCase(workingStatus, "Investigation")) {
          workingStatus = "Investigation";
        }
      }
      if (workingStatus === "Investigation") assertCaseTransition("Investigation", "Action in Progress");
      await tx.user.findUniqueOrThrow({ where: { id: ownerStaffId } });
      const version = current.version + 1;
      const action = await tx.correctiveAction.create({ data: {
        complaintId, type: input.type, title: input.title, description: input.description,
        ownerStaffId, responsibleParty: input.responsibleParty,
        expectedOutcome: input.expectedOutcome, workerVisibleSummary: input.workerVisibleSummary,
        dueAt: new Date(input.dueAt), followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined,
      } });
      const attachedDocuments: string[] = [];
      for (const evidenceId of input.attachmentEvidenceIds ?? []) {
        const evidence = await tx.evidenceDeclaration.findFirst({
          where: { id: evidenceId, complaintId, status: "available" },
        });
        if (!evidence) throw new BadRequestException("EVIDENCE_NOT_AVAILABLE");
        await tx.caseEvidenceLink.create({
          data: {
            complaintId,
            evidenceId,
            correctiveActionId: action.id,
            visibility: "internal",
            sensitivity: "standard",
          },
        });
        attachedDocuments.push(evidence.displayName);
      }
      await tx.complaint.update({
        where: { id: complaintId },
        data: {
          status: "Action in Progress",
          nextUpdateDueAt: new Date(input.dueAt),
          dueAt: new Date(input.dueAt),
          version,
        },
      });
      await this.auditMutation(tx, {
        complaintId,
        requestId: input.requestId,
        actorId,
        actionType: "Action Taken",
        auditAction: "case.corrective_action.created",
        fromStatus: current.status === "Investigation" ? current.status : undefined,
        toStatus: current.status === "Investigation" ? "Action in Progress" : undefined,
        version,
        visibility: "worker-visible",
        reasonData: {
          actionId: action.id,
          summary: input.workerVisibleSummary ?? input.description,
          simplifiedStage: "corrective-action-taken",
          ...(attachedDocuments.length > 0
            ? {
                attachedDocuments,
                attachedEvidenceIds: input.attachmentEvidenceIds ?? [],
              }
            : {}),
        },
      });
      return { id: complaintId, actionId: action.id, version, status: "Action in Progress" };
    });
  }

  @Patch(":id/corrective-actions/:actionId")
  @RequirePermission("case.mutate")
  async updateAction(@Param("id") id: string, @Param("actionId") actionId: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(correctiveActionUpdateSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      const existing = await tx.correctiveAction.findFirst({ where: { id: actionId, complaintId } });
      if (!existing) throw new NotFoundException("Corrective action not found");
      const version = current.version + 1;
      await tx.correctiveAction.update({ where: { id: actionId }, data: {
        state: input.state, actualResult: input.actualResult, cancellationReason: input.cancellationReason,
        followUpAt: input.followUpAt ? new Date(input.followUpAt) : undefined,
        completedAt: input.state === "completed" ? new Date() : undefined,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { version } });
      await this.auditMutation(tx, { complaintId, requestId: input.requestId, actorId, actionType: "Action Updated", auditAction: "case.corrective_action.updated", version, visibility: existing.workerVisibleSummary ? "worker-visible" : "internal", reasonData: { actionId, state: input.state, result: input.actualResult ?? "" } });
      return { id: complaintId, actionId, version, state: input.state };
    });
  }

  @Post(":id/referrals")
  @RequirePermission("case.mutate")
  async referral(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(referralInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      if (!["Triage", "Verification", "Investigation", "Action in Progress", "Escalated"].includes(current.status)) throw new BadRequestException("Case cannot be referred from its current stage");
      const version = current.version + 1;
      const referral = await tx.externalReferral.create({ data: {
        complaintId, organization: input.organization, reason: input.reason,
        referenceNumber: input.referenceNumber, consentState: input.consentState,
        referredAt: new Date(input.referredAt), ownerStaffId: input.ownerStaffId,
        status: input.status, outcome: input.outcome,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "Escalated", version } });
      await this.auditMutation(tx, { complaintId, requestId: input.requestId, actorId, actionType: "External Referral Recorded", auditAction: "case.referral.recorded", fromStatus: current.status === "Escalated" ? undefined : current.status, toStatus: current.status === "Escalated" ? undefined : "Escalated", version, visibility: "worker-visible", reasonData: { referralId: referral.id, organization: input.organization } });
      return { id: complaintId, referralId: referral.id, version, status: "Escalated" };
    });
  }

  @Post(":id/outcomes")
  @RequirePermission("case.mutate")
  async outcome(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(caseOutcomeInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, input.expectedVersion);
      if (!["Investigation", "Action in Progress"].includes(current.status)) throw new BadRequestException("Case must be in Investigation or Action in Progress");
      assertCaseTransition(current.status as CaseStatus, "Outcome Verification");
      const openActions = await tx.correctiveAction.count({ where: { complaintId, state: { in: ["planned", "accepted", "in-progress", "overdue"] } } });
      if (openActions > 0) throw new BadRequestException("OPEN_CORRECTIVE_ACTIONS");
      const version = current.version + 1;
      const outcome = await tx.caseOutcome.create({ data: {
        complaintId, remedyType: input.remedyType, details: input.details,
        remedyDelivered: input.remedyDelivered, deliveredAt: input.deliveredAt ? new Date(input.deliveredAt) : undefined,
        amountPaid: input.amountPaid, communicated: input.communicated,
        communicationChannel: input.communicationChannel,
        communicatedAt: input.communicatedAt ? new Date(input.communicatedAt) : undefined,
        communicationExceptionReason: input.communicationExceptionReason,
        retaliationSafetyResult: input.retaliationSafetyResult,
        workerVisibleSummary: input.workerVisibleSummary, recordedBy: actorId,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "Outcome Verification", version } });
      await this.auditMutation(tx, { complaintId, requestId: input.requestId, actorId, actionType: "Outcome Recorded", auditAction: "case.outcome.recorded", fromStatus: current.status, toStatus: "Outcome Verification", version, visibility: "worker-visible", reasonData: { outcomeId: outcome.id, summary: input.workerVisibleSummary } });
      return { id: complaintId, outcomeId: outcome.id, version, status: "Outcome Verification" };
    });
  }

  @Post(":id/close")
  @RequirePermission("case.mutate")
  async close(@Param("id") id: string, @Body() body: unknown, @Req() request: StaffRequest) {
    const input = this.parse(caseClosureInputSchema.safeParse(body));
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId }, include: { triage: true } });
      this.assertVersion(current.version, input.expectedVersion);
      this.assertCaseOpen(current.status);
      if (current.status !== "Outcome Verification") {
        assertCaseTransition(current.status as CaseStatus, "Closed");
        const version = current.version + 1;
        const closure = await tx.caseClosure.create({
          data: {
            complaintId,
            code: input.code,
            summary: input.summary,
            closedBy: actorId,
            checklistSnapshot: { simplified: true },
            communicationExceptionReason: input.communicationExceptionReason,
            outstandingReferralAcknowledged: input.outstandingReferralAcknowledged,
          },
        });
        await tx.complaint.update({ where: { id: complaintId }, data: { status: "Closed", version } });
        await this.auditMutation(tx, {
          complaintId,
          requestId: input.requestId,
          actorId,
          actionType: "Complaint Closed",
          auditAction: "case.closed",
          fromStatus: current.status,
          toStatus: "Closed",
          version,
          visibility: "worker-visible",
          reasonData: {
            closureId: closure.id,
            code: input.code,
            summary: input.summary,
            simplifiedStage: "close-complaint",
          },
        });
        return { id: complaintId, closureId: closure.id, version, status: "Closed" };
      }
      if (!current.assignedStaffId || !current.triage) throw new BadRequestException("TRIAGE_AND_ASSIGNMENT_REQUIRED");
      const [findingCount, openActionCount, latestOutcome, remedyEvidenceCount, openReferralCount] = await Promise.all([
        tx.investigationFinding.count({ where: { complaintId } }),
        tx.correctiveAction.count({ where: { complaintId, state: { in: ["planned", "accepted", "in-progress", "overdue"] } } }),
        tx.caseOutcome.findFirst({ where: { complaintId }, orderBy: { recordedAt: "desc" } }),
        tx.caseEvidenceLink.count({ where: { complaintId, caseOutcomeId: { not: null } } }),
        tx.externalReferral.count({ where: { complaintId, status: { in: ["submitted", "accepted", "in-progress"] } } }),
      ]);
      const nonInvestigation = ["outside-mandate", "duplicate-merged", "worker-withdrew"].includes(input.code);
      if (!nonInvestigation && findingCount === 0) throw new BadRequestException("FINDING_REQUIRED");
      if (openActionCount > 0) throw new BadRequestException("OPEN_CORRECTIVE_ACTIONS");
      if (!latestOutcome && !["outside-mandate", "duplicate-merged"].includes(input.code)) throw new BadRequestException("OUTCOME_REQUIRED");
      if (latestOutcome?.remedyDelivered && remedyEvidenceCount === 0) throw new BadRequestException("REMEDY_EVIDENCE_REQUIRED");
      if (latestOutcome && !latestOutcome.communicated && !(input.communicationExceptionReason ?? latestOutcome.communicationExceptionReason)?.trim()) throw new BadRequestException("COMMUNICATION_EXCEPTION_REQUIRED");
      if ((["Emergency", "Critical"].includes(current.priority) || current.triage.safetyRisk || current.triage.safeguardingRisk || current.triage.retaliationRisk) && !latestOutcome?.retaliationSafetyResult?.trim()) throw new BadRequestException("SAFETY_FOLLOW_UP_REQUIRED");
      if (openReferralCount > 0 && !input.outstandingReferralAcknowledged) throw new BadRequestException("OUTSTANDING_REFERRAL_ACKNOWLEDGEMENT_REQUIRED");
      assertCaseTransition("Outcome Verification", "Closed");
      const version = current.version + 1;
      const closure = await tx.caseClosure.create({ data: {
        complaintId, code: input.code, summary: input.summary, closedBy: actorId,
        checklistSnapshot: { findingCount, openActionCount, outcomeId: latestOutcome?.id ?? null },
        communicationExceptionReason: input.communicationExceptionReason,
        outstandingReferralAcknowledged: input.outstandingReferralAcknowledged,
      } });
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "Closed", version } });
      await this.auditMutation(tx, { complaintId, requestId: input.requestId, actorId, actionType: "Complaint Closed", auditAction: "case.closed", fromStatus: "Outcome Verification", toStatus: "Closed", version, visibility: "worker-visible", reasonData: { closureId: closure.id, code: input.code, summary: input.summary } });
      return { id: complaintId, closureId: closure.id, version, status: "Closed" };
    });
  }

  @Post(":id/staff-evidence")
  @RequirePermission("case.mutate")
  async uploadStaffEvidence(@Param("id") id: string, @Req() request: StaffRequest) {
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const fastify = request as StaffRequest & {
      parts: () => AsyncIterableIterator<{
        type: "file" | "field";
        fieldname: string;
        filename?: string;
        mimetype?: string;
        value?: string;
        toBuffer?: () => Promise<Buffer>;
      }>;
    };
    let expectedVersion: number | undefined;
    let uploadRequestId: string | undefined;
    let fileName = "staff-document.pdf";
    let declaredMimeType = "application/octet-stream";
    let fileBuffer: Buffer | undefined;
    let recordTimeline = true;

    for await (const part of fastify.parts()) {
      if (part.type === "field") {
        if (part.fieldname === "expectedVersion") expectedVersion = Number(part.value);
        if (part.fieldname === "requestId") uploadRequestId = part.value;
        if (part.fieldname === "recordTimeline") recordTimeline = part.value !== "false";
        continue;
      }
      if (part.fieldname !== "file") continue;
      fileName = part.filename ?? fileName;
      declaredMimeType = part.mimetype ?? declaredMimeType;
      fileBuffer = part.toBuffer ? await part.toBuffer() : undefined;
    }

    if (!Number.isInteger(expectedVersion) || !uploadRequestId || uploadRequestId.length < 8) {
      throw new BadRequestException("expectedVersion and requestId are required");
    }
    if (!fileBuffer?.length) throw new BadRequestException("file is required");

    return this.staffEvidence.uploadStaffDocument({
      complaintId,
      actorId,
      expectedVersion: expectedVersion as number,
      requestId: uploadRequestId,
      fileName,
      declaredMimeType,
      bytes: fileBuffer,
      recordTimeline,
    });
  }

  @Post(":id/evidence-links")
  @RequirePermission("case.mutate")
  async linkEvidence(@Param("id") id: string, @Body() body: {
    expectedVersion?: number; requestId?: string; evidenceId?: string;
    targetType?: "contact" | "finding" | "corrective-action" | "referral" | "outcome" | "closure";
    targetId?: string; visibility?: "internal" | "worker-visible"; sensitivity?: "standard" | "sensitive" | "restricted";
  }, @Req() request: StaffRequest) {
    if (!Number.isInteger(body.expectedVersion) || !body.requestId || !body.evidenceId || !body.targetType || !body.targetId || !body.visibility || !body.sensitivity) throw new BadRequestException("Complete evidence target metadata is required");
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    const requestId = body.requestId as string;
    const evidenceId = body.evidenceId as string;
    const targetType = body.targetType as NonNullable<typeof body.targetType>;
    const targetId = body.targetId as string;
    const visibility = body.visibility as NonNullable<typeof body.visibility>;
    const sensitivity = body.sensitivity as NonNullable<typeof body.sensitivity>;
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, body.expectedVersion as number);
      const evidence = await tx.evidenceDeclaration.findFirst({ where: { id: evidenceId, complaintId, status: "available" } });
      if (!evidence) throw new BadRequestException("EVIDENCE_NOT_AVAILABLE");
      const targetChecks = {
        contact: () => tx.workerContact.findFirst({ where: { id: targetId, complaintId } }),
        finding: () => tx.investigationFinding.findFirst({ where: { id: targetId, complaintId } }),
        "corrective-action": () => tx.correctiveAction.findFirst({ where: { id: targetId, complaintId } }),
        referral: () => tx.externalReferral.findFirst({ where: { id: targetId, complaintId } }),
        outcome: () => tx.caseOutcome.findFirst({ where: { id: targetId, complaintId } }),
        closure: () => tx.caseClosure.findFirst({ where: { id: targetId, complaintId } }),
      };
      if (!await targetChecks[targetType]()) throw new BadRequestException("EVIDENCE_TARGET_NOT_FOUND");
      const targetField = {
        contact: "workerContactId", finding: "findingId", "corrective-action": "correctiveActionId",
        referral: "externalReferralId", outcome: "caseOutcomeId", closure: "caseClosureId",
      } as const;
      const link = await tx.caseEvidenceLink.create({ data: {
        complaintId, evidenceId, visibility, sensitivity,
        [targetField[targetType]]: targetId,
      } });
      const version = current.version + 1;
      await tx.complaint.update({ where: { id: complaintId }, data: { version } });
      await this.auditMutation(tx, { complaintId, requestId, actorId, actionType: "Evidence Added", auditAction: "case.evidence.linked", version, visibility, reasonData: { linkId: link.id, evidenceId, targetType, targetId, sensitivity } });
      return { id: link.id, version };
    });
  }

  @Post(":id/reopen")
  @RequirePermission("case.mutate")
  async reopen(@Param("id") id: string, @Body() body: { expectedVersion?: number; requestId?: string; reason?: string }, @Req() request: StaffRequest) {
    if (!Number.isInteger(body.expectedVersion) || !body.requestId || !body.reason || body.reason.trim().length < 8) throw new BadRequestException("expectedVersion, requestId and reason are required");
    const reason = body.reason.trim();
    const requestId = body.requestId as string;
    const complaintId = await this.resolveCaseKey(id);
    const actorId = this.actor(request);
    return this.client.$transaction(async (tx) => {
      const current = await tx.complaint.findUniqueOrThrow({ where: { id: complaintId } });
      this.assertVersion(current.version, body.expectedVersion as number);
      assertCaseTransition(current.status as CaseStatus, "Reopened");
      const version = current.version + 1;
      await tx.complaint.update({ where: { id: complaintId }, data: { status: "Reopened", version } });
      await this.auditMutation(tx, { complaintId, requestId, actorId, actionType: "Complaint Reopened", auditAction: "case.reopened", fromStatus: current.status, toStatus: "Reopened", version, visibility: "worker-visible", reasonData: { reason } });
      return { id: complaintId, version, status: "Reopened" };
    });
  }

  private actionsFor(status: CaseStatus) {
    return {
      startTriage: status === "Received" || status === "Reopened",
      completeTriage: status === "Triage",
      recordContact: status === "Verification",
      addFact: status === "Verification" || status === "Investigation",
      addFinding: status === "Investigation",
      planAction: status === "Investigation" || status === "Action in Progress",
      updateAction: status === "Action in Progress",
      addReferral: !["Closed"].includes(status),
      recordOutcome: status === "Investigation" || status === "Action in Progress",
      close: status === "Outcome Verification",
      reopen: status === "Closed",
      addInternalNote: status !== "Closed",
      changePriority: status !== "Closed",
    };
  }

  private parse<T>(result: { success: true; data: T } | { success: false; error: { flatten(): unknown } }): T {
    if (!result.success) throw new BadRequestException(result.error.flatten());
    return result.data;
  }

  private actor(request: StaffRequest): string {
    if (!request.user?.userId) throw new BadRequestException("Authenticated staff actor is required");
    return request.user.userId;
  }

  private assertVersion(current: number, expected: number) {
    if (current !== expected) throw new ConflictException("VERSION_CONFLICT");
  }

  private assertCaseOpen(status: string) {
    if (status === "Closed") throw new BadRequestException("Case is closed");
  }

  private async resolveCaseKey(key: string): Promise<string> {
    const complaintId = await this.complaints.resolveComplaintId(key);
    if (!complaintId) throw new NotFoundException("Complaint not found");
    return complaintId;
  }

  private async auditMutation(tx: Prisma.TransactionClient, input: {
    complaintId: string; requestId: string; actorId: string; actionType: string; auditAction: string;
    version: number; visibility: "internal" | "worker-visible"; fromStatus?: string; toStatus?: string;
    reasonData: Record<string, unknown>;
  }) {
    await tx.caseHistory.create({ data: {
      complaintId: input.complaintId, actionType: input.actionType, actorType: "staff",
      actorId: input.actorId, visibility: input.visibility, requestId: input.requestId,
      fromStatus: input.fromStatus, toStatus: input.toStatus, reasonData: input.reasonData as Prisma.InputJsonValue,
      resourceVersion: input.version,
    } });
    await tx.auditEvent.create({ data: {
      complaintId: input.complaintId, actorType: "staff", actorId: input.actorId,
      action: input.auditAction, targetType: "complaint", targetId: input.complaintId,
      outcome: "success", requestId: input.requestId, metadata: input.reasonData as Prisma.InputJsonValue,
    } });
    await tx.outboxEvent.create({ data: {
      complaintId: input.complaintId, aggregateType: "complaint", aggregateId: input.complaintId,
      eventType: input.auditAction, payload: { complaintId: input.complaintId, version: input.version },
      dedupeKey: `${input.auditAction}:${input.requestId}`,
    } });
    if (input.visibility === "worker-visible") {
      await tx.outboxEvent.create({
        data: {
          complaintId: input.complaintId,
          aggregateType: "complaint",
          aggregateId: input.complaintId,
          eventType: "case.status-changed.v1",
          payload: {
            complaintId: input.complaintId,
            version: input.version,
            auditAction: input.auditAction,
            actionType: input.actionType,
            templateId: "case-update",
            reason: input.actionType,
          },
          dedupeKey: `case.status-changed.v1:${input.requestId}`,
        },
      });
    }
  }
}
