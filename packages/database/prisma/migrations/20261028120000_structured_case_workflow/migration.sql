ALTER TABLE "complaints" DROP CONSTRAINT IF EXISTS "complaints_status_check";
ALTER TABLE "case_history" DROP CONSTRAINT IF EXISTS "case_history_action_type_check";

ALTER TABLE "complaints"
  ADD COLUMN "legacy_due_at" TIMESTAMPTZ(3),
  ADD COLUMN "triage_due_at" TIMESTAMPTZ(3),
  ADD COLUMN "contact_due_at" TIMESTAMPTZ(3),
  ADD COLUMN "next_update_due_at" TIMESTAMPTZ(3);

UPDATE "complaints"
SET "legacy_due_at" = "due_at",
    "triage_due_at" = "submitted_at" + CASE "priority"
      WHEN 'Emergency' THEN INTERVAL '15 minutes'
      WHEN 'Critical' THEN INTERVAL '4 hours'
      WHEN 'High' THEN INTERVAL '1 day'
      ELSE INTERVAL '2 days' END,
    "contact_due_at" = "submitted_at" + CASE "priority"
      WHEN 'Emergency' THEN INTERVAL '30 minutes'
      WHEN 'Critical' THEN INTERVAL '8 hours'
      WHEN 'High' THEN INTERVAL '2 days'
      ELSE INTERVAL '3 days' END,
    "next_update_due_at" = "submitted_at" + CASE "priority"
      WHEN 'Emergency' THEN INTERVAL '1 day'
      WHEN 'Critical' THEN INTERVAL '2 days'
      WHEN 'High' THEN INTERVAL '3 days'
      ELSE INTERVAL '5 days' END;

UPDATE "complaints" SET "status" = CASE "status"
  WHEN 'Draft' THEN 'Received'
  WHEN 'Submitted' THEN 'Received'
  WHEN 'New' THEN 'Received'
  WHEN 'Under Review' THEN 'Triage'
  WHEN 'Awaiting Worker' THEN 'Verification'
  WHEN 'Proposed Resolution' THEN 'Outcome Verification'
  WHEN 'Resolved' THEN 'Closed'
  ELSE "status" END;

ALTER TABLE "complaints"
  ALTER COLUMN "status" SET DEFAULT 'Received',
  ADD CONSTRAINT "complaints_status_check" CHECK ("status" IN
    ('Received','Triage','Verification','Investigation','Action in Progress','Outcome Verification','Escalated','Closed','Reopened'));

ALTER TABLE "case_history" ADD CONSTRAINT "case_history_action_type_check" CHECK ("action_type" IN (
  'Triage Completed','Priority Changed','Internal Note Added','Contact Attempted','Contact Successful',
  'Emergency Contact Override','Verified Fact Recorded','Evidence Added','Investigation Finding Recorded',
  'Action Planned','Action Updated','External Referral Recorded','Escalated','Outcome Recorded',
  'Complaint Closed','Complaint Reopened','Worker Feedback Recorded','Complaint Received','Assignment Changed',
  'Review Started','Worker Contact Attempted','Worker Contact Successful','More Information Requested',
  'Investigation Finding Added','Action Taken','Referral Recorded','Proposed Resolution','Resolved','Closed','Reopened'
));

ALTER TABLE "reporters"
  ADD COLUMN "contact_preference" VARCHAR(24) NOT NULL DEFAULT 'do-not-initiate',
  ADD COLUMN "safe_contact_window" VARCHAR(160),
  ADD COLUMN "preferred_language" VARCHAR(8),
  ADD COLUMN "safe_voicemail" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "representative_contact" VARCHAR(160);

UPDATE "reporters" SET "contact_preference" = CASE WHEN "contact_allowed" THEN 'either' ELSE 'do-not-initiate' END;

CREATE TABLE "case_triage" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL,
  "assigned_staff_id" UUID NOT NULL, "category_code" VARCHAR(3) NOT NULL,
  "subcategory_code" VARCHAR(7), "priority" VARCHAR(16) NOT NULL, "priority_reason" TEXT NOT NULL,
  "scope" VARCHAR(16) NOT NULL, "safety_risk" BOOLEAN NOT NULL, "safeguarding_risk" BOOLEAN NOT NULL,
  "retaliation_risk" BOOLEAN NOT NULL, "conflict_of_interest" BOOLEAN NOT NULL,
  "investigation_route" TEXT NOT NULL, "next_action" TEXT NOT NULL, "next_action_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_by" UUID NOT NULL, "completed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_triage_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "case_triage_scope_check" CHECK ("scope" IN ('individual','collective'))
);

CREATE TABLE "worker_contacts" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL,
  "channel" VARCHAR(24) NOT NULL, "outcome" VARCHAR(32) NOT NULL, "occurred_at" TIMESTAMPTZ(3) NOT NULL,
  "staff_actor_id" UUID NOT NULL, "language" VARCHAR(8) NOT NULL, "safe_contact_confirmed" BOOLEAN NOT NULL,
  "emergency_override" BOOLEAN NOT NULL DEFAULT FALSE, "override_reason" TEXT,
  "representative_name" VARCHAR(160), "additional_facts" TEXT, "requested_outcome" TEXT,
  "read_back_confirmed" BOOLEAN, "follow_up_at" TIMESTAMPTZ(3), "summary" TEXT NOT NULL,
  "visibility" VARCHAR(24) NOT NULL, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "worker_contacts_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "worker_contacts_channel_check" CHECK ("channel" IN ('call','message','representative','none')),
  CONSTRAINT "worker_contacts_outcome_check" CHECK ("outcome" IN ('connected','follow-up-needed','no-answer','unavailable','wrong-number','unsafe-to-speak','callback-requested','prohibited','representative-contacted')),
  CONSTRAINT "worker_contacts_override_reason_check" CHECK (NOT "emergency_override" OR length(trim(COALESCE("override_reason",''))) >= 8)
);

CREATE TABLE "case_facts" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "worker_contact_id" UUID,
  "fact" TEXT NOT NULL, "structured_value" JSONB, "source_type" VARCHAR(32) NOT NULL,
  "source_record_id" UUID, "verification_state" VARCHAR(24) NOT NULL,
  "recorded_by" UUID NOT NULL, "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_facts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "investigation_findings" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "issue" TEXT NOT NULL,
  "allegation" TEXT NOT NULL, "conclusion" VARCHAR(32) NOT NULL, "rationale" TEXT NOT NULL,
  "root_cause" TEXT, "affected_scope" TEXT, "recommended_action" TEXT,
  "recorded_by" UUID NOT NULL, "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "investigation_findings_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "investigation_findings_conclusion_check" CHECK ("conclusion" IN ('substantiated','partially-substantiated','not-substantiated','unable-to-determine'))
);

CREATE TABLE "corrective_actions" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "type" VARCHAR(64) NOT NULL,
  "title" VARCHAR(200) NOT NULL, "description" TEXT NOT NULL, "owner_staff_id" UUID NOT NULL,
  "responsible_party" VARCHAR(200), "expected_outcome" TEXT NOT NULL, "worker_visible_summary" TEXT,
  "state" VARCHAR(24) NOT NULL DEFAULT 'planned', "agreed_at" TIMESTAMPTZ(3), "due_at" TIMESTAMPTZ(3) NOT NULL,
  "completed_at" TIMESTAMPTZ(3), "follow_up_at" TIMESTAMPTZ(3), "actual_result" TEXT,
  "cancellation_reason" TEXT, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "corrective_actions_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "corrective_actions_state_check" CHECK ("state" IN ('planned','accepted','in-progress','completed','rejected','cancelled','overdue'))
);

CREATE TABLE "external_referrals" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "organization" VARCHAR(200) NOT NULL,
  "reason" TEXT NOT NULL, "reference_number" VARCHAR(100), "consent_state" VARCHAR(24) NOT NULL,
  "referred_at" TIMESTAMPTZ(3) NOT NULL, "owner_staff_id" UUID NOT NULL, "status" VARCHAR(24) NOT NULL,
  "outcome" TEXT, "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "external_referrals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "case_outcomes" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "remedy_type" VARCHAR(64) NOT NULL,
  "details" TEXT NOT NULL, "remedy_delivered" BOOLEAN NOT NULL, "delivered_at" TIMESTAMPTZ(3),
  "amount_paid" DECIMAL(14,2), "communicated" BOOLEAN NOT NULL, "communication_channel" VARCHAR(24),
  "communicated_at" TIMESTAMPTZ(3), "communication_exception_reason" TEXT,
  "retaliation_safety_result" TEXT, "worker_visible_summary" TEXT NOT NULL,
  "recorded_by" UUID NOT NULL, "recorded_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_outcomes_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "case_outcomes_communication_check" CHECK ("communicated" OR length(trim(COALESCE("communication_exception_reason",''))) >= 8)
);

CREATE TABLE "case_closures" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "code" VARCHAR(32) NOT NULL,
  "summary" TEXT NOT NULL, "closed_by" UUID NOT NULL, "closed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "checklist_snapshot" JSONB NOT NULL, "communication_exception_reason" TEXT,
  "outstanding_referral_acknowledged" BOOLEAN NOT NULL,
  CONSTRAINT "case_closures_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "case_closures_code_check" CHECK ("code" IN ('remedy-verified','partially-remedied','referred-externally','outside-mandate','duplicate-merged','worker-withdrew','unable-to-proceed'))
);

CREATE TABLE "case_evidence_links" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL, "evidence_id" UUID NOT NULL,
  "worker_contact_id" UUID, "finding_id" UUID, "corrective_action_id" UUID,
  "external_referral_id" UUID, "case_outcome_id" UUID, "case_closure_id" UUID,
  "visibility" VARCHAR(24) NOT NULL, "sensitivity" VARCHAR(24) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "case_evidence_links_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "case_evidence_links_one_parent_check" CHECK (num_nonnulls("worker_contact_id","finding_id","corrective_action_id","external_referral_id","case_outcome_id","case_closure_id") = 1)
);

CREATE UNIQUE INDEX "case_triage_complaint_key" ON "case_triage"("complaint_id");
CREATE INDEX "case_triage_assignee_idx" ON "case_triage"("assigned_staff_id", "completed_at" DESC);
CREATE INDEX "worker_contacts_complaint_at_idx" ON "worker_contacts"("complaint_id", "occurred_at" DESC);
CREATE INDEX "worker_contacts_outcome_followup_idx" ON "worker_contacts"("outcome", "follow_up_at");
CREATE INDEX "case_facts_complaint_at_idx" ON "case_facts"("complaint_id", "recorded_at" DESC);
CREATE INDEX "investigation_findings_complaint_at_idx" ON "investigation_findings"("complaint_id", "recorded_at" DESC);
CREATE INDEX "corrective_actions_case_state_due_idx" ON "corrective_actions"("complaint_id", "state", "due_at");
CREATE INDEX "corrective_actions_owner_state_due_idx" ON "corrective_actions"("owner_staff_id", "state", "due_at");
CREATE INDEX "external_referrals_complaint_at_idx" ON "external_referrals"("complaint_id", "referred_at" DESC);
CREATE INDEX "case_outcomes_complaint_at_idx" ON "case_outcomes"("complaint_id", "recorded_at" DESC);
CREATE INDEX "case_closures_complaint_closed_idx" ON "case_closures"("complaint_id", "closed_at" DESC);
CREATE UNIQUE INDEX "case_evidence_links_evidence_key" ON "case_evidence_links"("evidence_id");
CREATE INDEX "case_evidence_links_complaint_at_idx" ON "case_evidence_links"("complaint_id", "created_at");
CREATE INDEX "complaints_triage_due_idx" ON "complaints"("triage_due_at");
CREATE INDEX "complaints_contact_due_idx" ON "complaints"("contact_due_at");
CREATE INDEX "complaints_update_due_idx" ON "complaints"("next_update_due_at");

ALTER TABLE "case_triage" ADD CONSTRAINT "case_triage_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "worker_contacts" ADD CONSTRAINT "worker_contacts_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_facts" ADD CONSTRAINT "case_facts_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_facts" ADD CONSTRAINT "case_facts_contact_fkey" FOREIGN KEY ("worker_contact_id") REFERENCES "worker_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "investigation_findings" ADD CONSTRAINT "investigation_findings_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "corrective_actions" ADD CONSTRAINT "corrective_actions_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "external_referrals" ADD CONSTRAINT "external_referrals_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_outcomes" ADD CONSTRAINT "case_outcomes_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_closures" ADD CONSTRAINT "case_closures_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_complaint_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_evidence_fkey" FOREIGN KEY ("evidence_id") REFERENCES "evidence_declarations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_contact_fkey" FOREIGN KEY ("worker_contact_id") REFERENCES "worker_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_finding_fkey" FOREIGN KEY ("finding_id") REFERENCES "investigation_findings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_action_fkey" FOREIGN KEY ("corrective_action_id") REFERENCES "corrective_actions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_referral_fkey" FOREIGN KEY ("external_referral_id") REFERENCES "external_referrals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_outcome_fkey" FOREIGN KEY ("case_outcome_id") REFERENCES "case_outcomes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "case_evidence_links" ADD CONSTRAINT "case_evidence_links_closure_fkey" FOREIGN KEY ("case_closure_id") REFERENCES "case_closures"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE UNIQUE INDEX "case_history_complaint_request_key" ON "case_history"("complaint_id", "request_id");
CREATE UNIQUE INDEX "case_closures_complaint_key" ON "case_closures"("complaint_id");

INSERT INTO "case_closures" ("complaint_id", "code", "summary", "closed_by", "closed_at", "checklist_snapshot", "outstanding_referral_acknowledged")
SELECT c."id", 'remedy-verified', COALESCE(r."summary", 'Legacy resolved or closed case'),
       COALESCE(r."actor_id", '00000000-0000-0000-0000-000000000000'::uuid),
       COALESCE(r."resolved_at", c."updated_at"), '{"legacy":true}'::jsonb, TRUE
FROM "complaints" c
LEFT JOIN LATERAL (
  SELECT "summary", "actor_id", "resolved_at" FROM "resolutions"
  WHERE "complaint_id" = c."id" ORDER BY "proposed_at" DESC LIMIT 1
) r ON TRUE
WHERE c."status" = 'Closed'
ON CONFLICT ("complaint_id") DO NOTHING;
