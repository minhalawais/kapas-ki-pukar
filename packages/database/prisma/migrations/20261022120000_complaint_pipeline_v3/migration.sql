ALTER TABLE "complaints"
  ADD COLUMN "client_submission_id" UUID,
  ADD COLUMN "evidence_status" VARCHAR(24) NOT NULL DEFAULT 'none';

CREATE UNIQUE INDEX "complaints_client_submission_id_key"
  ON "complaints"("client_submission_id");

CREATE TABLE "evidence_declarations" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "complaint_id" UUID NOT NULL,
  "client_media_id" UUID NOT NULL,
  "kind" VARCHAR(16) NOT NULL,
  "display_name" VARCHAR(255) NOT NULL,
  "declared_mime_type" VARCHAR(100) NOT NULL,
  "total_bytes" BIGINT NOT NULL,
  "uploaded_bytes" BIGINT NOT NULL DEFAULT 0,
  "status" VARCHAR(24) NOT NULL DEFAULT 'declared',
  "reason_code" VARCHAR(100),
  "quarantine_bucket" VARCHAR(100),
  "quarantine_key" TEXT,
  "protected_key" TEXT,
  "detected_mime_type" VARCHAR(100),
  "sha256_digest" BYTEA,
  "scan_engine" VARCHAR(64),
  "scan_engine_version" VARCHAR(64),
  "scanned_at" TIMESTAMPTZ(3),
  "wrapped_data_key" BYTEA,
  "encryption_nonce" BYTEA,
  "encryption_auth_tag" BYTEA,
  "encryption_key_id" VARCHAR(100),
  "replacement_for_id" UUID,
  "captured_at" TIMESTAMPTZ(3),
  "recorded_at" TIMESTAMPTZ(3),
  "duration_ms" INTEGER,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "evidence_declarations_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "evidence_declarations_positive_bytes" CHECK ("total_bytes" > 0),
  CONSTRAINT "evidence_declarations_monotonic_bytes" CHECK ("uploaded_bytes" >= 0 AND "uploaded_bytes" <= "total_bytes"),
  CONSTRAINT "evidence_declarations_kind_check" CHECK ("kind" IN ('voice', 'photo', 'document')),
  CONSTRAINT "evidence_declarations_status_check" CHECK ("status" IN ('declared', 'uploading', 'quarantined', 'scanning', 'available', 'rejected', 'omitted', 'expired'))
);

CREATE UNIQUE INDEX "evidence_declarations_complaint_media_key"
  ON "evidence_declarations"("complaint_id", "client_media_id");
CREATE INDEX "evidence_declarations_complaint_status_idx"
  ON "evidence_declarations"("complaint_id", "status");

ALTER TABLE "evidence_declarations"
  ADD CONSTRAINT "evidence_declarations_complaint_id_fkey"
  FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "tus_upload_grants" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "evidence_id" UUID NOT NULL,
  "tus_upload_id" VARCHAR(200),
  "token_hash" VARCHAR(128) NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'active',
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "terminated_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "tus_upload_grants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tus_upload_grants_evidence_id_key" ON "tus_upload_grants"("evidence_id");
CREATE UNIQUE INDEX "tus_upload_grants_upload_id_key" ON "tus_upload_grants"("tus_upload_id");
CREATE UNIQUE INDEX "tus_upload_grants_token_hash_key" ON "tus_upload_grants"("token_hash");
CREATE INDEX "tus_upload_grants_expiry_status_idx" ON "tus_upload_grants"("expires_at", "status");

ALTER TABLE "tus_upload_grants"
  ADD CONSTRAINT "tus_upload_grants_evidence_id_fkey"
  FOREIGN KEY ("evidence_id") REFERENCES "evidence_declarations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "intake_receipts" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "complaint_id" UUID NOT NULL,
  "client_submission_id" UUID NOT NULL,
  "idempotency_key_hash" VARCHAR(128) NOT NULL,
  "request_hash" VARCHAR(128) NOT NULL,
  "secret_ciphertext" BYTEA NOT NULL,
  "secret_nonce" BYTEA NOT NULL,
  "secret_auth_tag" BYTEA NOT NULL,
  "secret_key_id" VARCHAR(100) NOT NULL,
  "crypto_version" SMALLINT NOT NULL DEFAULT 1,
  "accepted_at" TIMESTAMPTZ(3) NOT NULL,
  "recovery_expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "intake_receipts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "intake_receipts_complaint_id_key" ON "intake_receipts"("complaint_id");
CREATE UNIQUE INDEX "intake_receipts_client_submission_id_key" ON "intake_receipts"("client_submission_id");
CREATE INDEX "intake_receipts_recovery_expiry_idx" ON "intake_receipts"("recovery_expires_at");

ALTER TABLE "intake_receipts"
  ADD CONSTRAINT "intake_receipts_complaint_id_fkey"
  FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
