-- Human references are non-authorizing, random and independent from UUID/order.
CREATE OR REPLACE FUNCTION generate_complaint_reference()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
  SELECT 'KP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' ||
         upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)) || '-' ||
         upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4));
$$;

-- CreateTable
CREATE TABLE "complaints" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "reference_number" VARCHAR(32) NOT NULL DEFAULT generate_complaint_reference(),
    "category_code" VARCHAR(3) NOT NULL,
    "subcategory_code" VARCHAR(7),
    "status" VARCHAR(32) NOT NULL DEFAULT 'New',
    "priority" VARCHAR(16) NOT NULL,
    "privacy_mode" VARCHAR(4) NOT NULL,
    "reporter_type" VARCHAR(32) NOT NULL,
    "affected_worker_type" VARCHAR(32),
    "gender" VARCHAR(16),
    "submitted_at" TIMESTAMPTZ(3) NOT NULL,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,
    "due_at" TIMESTAMPTZ(3) NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "assigned_staff_id" UUID,
    "created_source" VARCHAR(16) NOT NULL,
    "schema_version" SMALLINT NOT NULL,
    "retention_state" VARCHAR(24) NOT NULL DEFAULT 'active',
    "archived_at" TIMESTAMPTZ(3),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "incidents" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "when_label" VARCHAR(100) NOT NULL,
    "occurred_at" TIMESTAMPTZ(3),
    "description" TEXT,
    "current_danger" BOOLEAN NOT NULL DEFAULT false,
    "immediate_danger" BOOLEAN NOT NULL DEFAULT false,
    "others_affected" VARCHAR(24) NOT NULL,
    "structured_answers" JSONB NOT NULL DEFAULT '{}',
    "schema_version" SMALLINT NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "incidents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "complaint_locations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "province" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "tehsil" VARCHAR(100),
    "village_label" VARCHAR(160),
    "descriptive_place" VARCHAR(500),
    "source" VARCHAR(16) NOT NULL,
    "accuracy_meters" INTEGER,
    "exact_coordinates_ciphertext" BYTEA,
    "exact_coordinates_nonce" BYTEA,
    "exact_coordinates_key_id" VARCHAR(100),
    "exact_coordinates_algorithm" VARCHAR(32),
    "analytics_province" VARCHAR(100) NOT NULL,
    "analytics_district" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "complaint_locations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reporters" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "display_name" VARCHAR(160),
    "contact_allowed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporters_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "private_reporter_identities" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "ciphertext" BYTEA NOT NULL,
    "nonce" BYTEA NOT NULL,
    "key_id" VARCHAR(100) NOT NULL,
    "algorithm" VARCHAR(32) NOT NULL,
    "display_suffix" VARCHAR(8) NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "private_reporter_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence_assets" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "storage_id" UUID NOT NULL,
    "complaint_id" UUID NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "storage_name" VARCHAR(100) NOT NULL,
    "detected_mime_type" VARCHAR(100) NOT NULL,
    "byte_length" BIGINT NOT NULL,
    "sha256_digest" BYTEA NOT NULL,
    "upload_state" VARCHAR(24) NOT NULL,
    "scan_state" VARCHAR(24) NOT NULL,
    "availability_state" VARCHAR(24) NOT NULL,
    "encryption_key_id" VARCHAR(100) NOT NULL,
    "encryption_algorithm" VARCHAR(32) NOT NULL,
    "captured_at" TIMESTAMPTZ(3),
    "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "retention_state" VARCHAR(24) NOT NULL DEFAULT 'active',
    "deleted_at" TIMESTAMPTZ(3),
    "uploader_actor_type" VARCHAR(16) NOT NULL,
    "uploader_actor_id" UUID,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "evidence_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "case_history" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "action_type" VARCHAR(48) NOT NULL,
    "actor_type" VARCHAR(16) NOT NULL,
    "actor_id" UUID,
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "visibility" VARCHAR(24) NOT NULL,
    "request_id" VARCHAR(100) NOT NULL,
    "from_status" VARCHAR(32),
    "to_status" VARCHAR(32),
    "from_priority" VARCHAR(16),
    "to_priority" VARCHAR(16),
    "reason_data" JSONB,
    "resource_version" INTEGER NOT NULL,

    CONSTRAINT "case_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resolutions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "summary" TEXT NOT NULL,
    "proposed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMPTZ(3),
    "actor_type" VARCHAR(16) NOT NULL,
    "actor_id" UUID,
    "request_id" VARCHAR(100) NOT NULL,

    CONSTRAINT "resolutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "worker_feedback" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "outcome" VARCHAR(16) NOT NULL,
    "comment" TEXT,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "request_id" VARCHAR(100) NOT NULL,

    CONSTRAINT "worker_feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_analysis_runs" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "input_references" JSONB NOT NULL,
    "provider" VARCHAR(100) NOT NULL,
    "model" VARCHAR(100) NOT NULL,
    "prompt_version" VARCHAR(50) NOT NULL,
    "output" JSONB,
    "confidence" DECIMAL(5,4),
    "warnings" JSONB NOT NULL DEFAULT '[]',
    "human_review_state" VARCHAR(24) NOT NULL,
    "failure_state" VARCHAR(50),
    "started_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMPTZ(3),

    CONSTRAINT "ai_analysis_runs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "outbox_events" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID,
    "aggregate_type" VARCHAR(50) NOT NULL,
    "aggregate_id" UUID NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "payload" JSONB NOT NULL,
    "dedupe_key" VARCHAR(160) NOT NULL,
    "status" VARCHAR(24) NOT NULL DEFAULT 'pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ(3),
    "last_attempt_at" TIMESTAMPTZ(3),
    "last_error_code" VARCHAR(100),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_events" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID,
    "actor_type" VARCHAR(16) NOT NULL,
    "actor_id" UUID,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50) NOT NULL,
    "target_id" UUID NOT NULL,
    "outcome" VARCHAR(24) NOT NULL,
    "purpose" VARCHAR(100),
    "request_id" VARCHAR(100) NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "occurred_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "idempotency_records" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "scope" VARCHAR(100) NOT NULL,
    "key_hash" VARCHAR(128) NOT NULL,
    "request_hash" VARCHAR(128) NOT NULL,
    "resource_type" VARCHAR(50) NOT NULL,
    "resource_id" UUID NOT NULL,
    "response" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "idempotency_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_reference_number_key" ON "complaints"("reference_number");

-- CreateIndex
CREATE INDEX "complaints_queue_idx" ON "complaints"("status", "priority", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "complaints_updated_at_idx" ON "complaints"("updated_at" DESC);

-- CreateIndex
CREATE INDEX "complaints_due_at_idx" ON "complaints"("due_at");

-- CreateIndex
CREATE INDEX "complaints_category_idx" ON "complaints"("category_code", "subcategory_code");

-- CreateIndex
CREATE INDEX "complaints_assignment_idx" ON "complaints"("assigned_staff_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "incidents_complaint_id_key" ON "incidents"("complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "complaint_locations_complaint_id_key" ON "complaint_locations"("complaint_id");

-- CreateIndex
CREATE INDEX "complaint_locations_analytics_geo_idx" ON "complaint_locations"("analytics_province", "analytics_district");

-- CreateIndex
CREATE UNIQUE INDEX "reporters_complaint_id_key" ON "reporters"("complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "private_reporter_identities_complaint_id_key" ON "private_reporter_identities"("complaint_id");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_assets_storage_id_key" ON "evidence_assets"("storage_id");

-- CreateIndex
CREATE INDEX "evidence_assets_complaint_state_idx" ON "evidence_assets"("complaint_id", "availability_state");

-- CreateIndex
CREATE INDEX "case_history_complaint_at_idx" ON "case_history"("complaint_id", "occurred_at");

-- CreateIndex
CREATE INDEX "case_history_actor_at_idx" ON "case_history"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "resolutions_complaint_at_idx" ON "resolutions"("complaint_id", "proposed_at" DESC);

-- CreateIndex
CREATE INDEX "worker_feedback_complaint_at_idx" ON "worker_feedback"("complaint_id", "submitted_at" DESC);

-- CreateIndex
CREATE INDEX "ai_analysis_runs_complaint_at_idx" ON "ai_analysis_runs"("complaint_id", "started_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "outbox_events_dedupe_key_key" ON "outbox_events"("dedupe_key");

-- CreateIndex
CREATE INDEX "outbox_events_pending_idx" ON "outbox_events"("status", "available_at");

-- CreateIndex
CREATE INDEX "audit_events_complaint_at_idx" ON "audit_events"("complaint_id", "occurred_at");

-- CreateIndex
CREATE INDEX "audit_events_actor_at_idx" ON "audit_events"("actor_id", "occurred_at");

-- CreateIndex
CREATE INDEX "idempotency_records_expires_at_idx" ON "idempotency_records"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "idempotency_records_scope_key_hash_key" ON "idempotency_records"("scope", "key_hash");

-- AddForeignKey
ALTER TABLE "incidents" ADD CONSTRAINT "incidents_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "complaint_locations" ADD CONSTRAINT "complaint_locations_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reporters" ADD CONSTRAINT "reporters_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "private_reporter_identities" ADD CONSTRAINT "private_reporter_identities_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence_assets" ADD CONSTRAINT "evidence_assets_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "case_history" ADD CONSTRAINT "case_history_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resolutions" ADD CONSTRAINT "resolutions_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "worker_feedback" ADD CONSTRAINT "worker_feedback_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_analysis_runs" ADD CONSTRAINT "ai_analysis_runs_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "outbox_events" ADD CONSTRAINT "outbox_events_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_events" ADD CONSTRAINT "audit_events_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Domain/reference constraints intentionally use CHECK constraints rather than
-- PostgreSQL enums so additive taxonomy/lifecycle changes can use low-lock migrations.
ALTER TABLE "complaints"
  ADD CONSTRAINT "complaints_category_code_check" CHECK ("category_code" IN ('WAG','PES','HSE','HAR','CHL','FOL','CON','HRS','SAN','DIS','OTH')),
  ADD CONSTRAINT "complaints_subcategory_code_check" CHECK ("subcategory_code" IS NULL OR "subcategory_code" IN ('WAG-UNP','WAG-DEL','WAG-UND','WAG-DED','WAG-PIE','WAG-OVT','WAG-OTH','PES-EXP','PES-REI','PES-PPE','PES-SYM','PES-INF','PES-OTH','HSE-INJ','HSE-HEA','HSE-EQP','HSE-TRN','HSE-MED','HSE-OTH','HAR-VER','HAR-SEX','HAR-INT','HAR-RET','HAR-OTH','CHL-WRK','CHL-HAZ','CHL-HRS','CHL-OTH','FOL-FOR','FOL-DEB','FOL-MOV','FOL-THR','FOL-DOC','FOL-OTH','CON-PAY','CON-ABU','CON-FEE','CON-MIS','CON-CON','CON-OTH','HRS-EXC','HRS-RST','HRS-FOT','HRS-OTH','SAN-WAT','SAN-TLT','SAN-WAS','SAN-WOM','SAN-OTH','DIS-GEN','DIS-ETH','DIS-MIG','DIS-AGE','DIS-OTH')),
  ADD CONSTRAINT "complaints_subcategory_parent_check" CHECK ("subcategory_code" IS NULL OR left("subcategory_code", 3) = "category_code"),
  ADD CONSTRAINT "complaints_status_check" CHECK ("status" IN ('Draft','Submitted','New','Under Review','Awaiting Worker','Action in Progress','Escalated','Proposed Resolution','Resolved','Reopened','Closed')),
  ADD CONSTRAINT "complaints_priority_check" CHECK ("priority" IN ('Emergency','Critical','High','Standard')),
  ADD CONSTRAINT "complaints_privacy_mode_check" CHECK ("privacy_mode" IN ('ANON','CONF','IDEN')),
  ADD CONSTRAINT "complaints_reporter_type_check" CHECK ("reporter_type" IN ('self','coworker','family','puwf-field','community','other')),
  ADD CONSTRAINT "complaints_created_source_check" CHECK ("created_source" IN ('mobile','staff','system')),
  ADD CONSTRAINT "complaints_version_check" CHECK ("version" > 0),
  ADD CONSTRAINT "complaints_time_order_check" CHECK ("due_at" >= "submitted_at");

ALTER TABLE "incidents"
  ADD CONSTRAINT "incidents_others_affected_check" CHECK ("others_affected" IN ('individual','2-5','6-20','more-than-20','not-sure')),
  ADD CONSTRAINT "incidents_structured_answers_size_check" CHECK (pg_column_size("structured_answers") <= 65536);

ALTER TABLE "complaint_locations"
  ADD CONSTRAINT "complaint_locations_source_check" CHECK ("source" IN ('device','manual')),
  ADD CONSTRAINT "complaint_locations_accuracy_check" CHECK ("accuracy_meters" IS NULL OR "accuracy_meters" >= 0),
  ADD CONSTRAINT "complaint_locations_exact_coordinates_complete_check" CHECK (
    ("exact_coordinates_ciphertext" IS NULL AND "exact_coordinates_nonce" IS NULL AND "exact_coordinates_key_id" IS NULL AND "exact_coordinates_algorithm" IS NULL)
    OR
    ("exact_coordinates_ciphertext" IS NOT NULL AND "exact_coordinates_nonce" IS NOT NULL AND "exact_coordinates_key_id" IS NOT NULL AND "exact_coordinates_algorithm" = 'AES-256-GCM')
  );

ALTER TABLE "private_reporter_identities"
  ADD CONSTRAINT "private_reporter_identities_kind_check" CHECK ("kind" IN ('cnic','phone')),
  ADD CONSTRAINT "private_reporter_identities_algorithm_check" CHECK ("algorithm" = 'AES-256-GCM'),
  ADD CONSTRAINT "private_reporter_identities_nonce_check" CHECK (octet_length("nonce") BETWEEN 12 AND 32),
  ADD CONSTRAINT "private_reporter_identities_suffix_check" CHECK (char_length("display_suffix") BETWEEN 2 AND 8);

ALTER TABLE "evidence_assets"
  ADD CONSTRAINT "evidence_assets_kind_check" CHECK ("kind" IN ('voice','photo','document')),
  ADD CONSTRAINT "evidence_assets_byte_length_check" CHECK ("byte_length" >= 0),
  ADD CONSTRAINT "evidence_assets_sha256_check" CHECK (octet_length("sha256_digest") = 32),
  ADD CONSTRAINT "evidence_assets_encryption_check" CHECK ("encryption_algorithm" = 'AES-256-GCM');

ALTER TABLE "case_history"
  ADD CONSTRAINT "case_history_action_type_check" CHECK ("action_type" IN ('Review Started','Priority Changed','Internal Note Added','Worker Contact Attempted','Worker Contact Successful','More Information Requested','Evidence Added','Investigation Finding Added','Action Taken','Referral Recorded','Escalated','Proposed Resolution','Resolved','Closed','Reopened','Worker Feedback Recorded','Complaint Received')),
  ADD CONSTRAINT "case_history_actor_type_check" CHECK ("actor_type" IN ('worker','staff','system')),
  ADD CONSTRAINT "case_history_visibility_check" CHECK ("visibility" IN ('internal','worker-visible')),
  ADD CONSTRAINT "case_history_version_check" CHECK ("resource_version" > 0);

ALTER TABLE "worker_feedback"
  ADD CONSTRAINT "worker_feedback_outcome_check" CHECK ("outcome" IN ('satisfied','partial','unresolved'));

ALTER TABLE "ai_analysis_runs"
  ADD CONSTRAINT "ai_analysis_runs_confidence_check" CHECK ("confidence" IS NULL OR ("confidence" >= 0 AND "confidence" <= 1));

ALTER TABLE "outbox_events"
  ADD CONSTRAINT "outbox_events_status_check" CHECK ("status" IN ('pending','processing','delivered','failed','dead-letter')),
  ADD CONSTRAINT "outbox_events_attempt_count_check" CHECK ("attempt_count" >= 0),
  ADD CONSTRAINT "outbox_events_payload_size_check" CHECK (pg_column_size("payload") <= 65536);

-- Anonymous complaints can never have a private identity row, even if an adapter is bypassed.
CREATE OR REPLACE FUNCTION reject_anonymous_private_identity()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM "complaints" WHERE "id" = NEW."complaint_id" AND "privacy_mode" = 'ANON') THEN
    RAISE EXCEPTION 'anonymous complaint cannot have private identity' USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER "private_reporter_identity_privacy_guard"
BEFORE INSERT OR UPDATE ON "private_reporter_identities"
FOR EACH ROW EXECUTE FUNCTION reject_anonymous_private_identity();

-- Material history and audit facts are append-only at the database boundary.
CREATE OR REPLACE FUNCTION reject_append_only_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME USING ERRCODE = '55000';
END;
$$;

CREATE TRIGGER "case_history_append_only_guard"
BEFORE UPDATE OR DELETE ON "case_history"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();

CREATE TRIGGER "audit_events_append_only_guard"
BEFORE UPDATE OR DELETE ON "audit_events"
FOR EACH ROW EXECUTE FUNCTION reject_append_only_mutation();
