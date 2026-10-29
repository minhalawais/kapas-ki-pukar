ALTER TABLE "complaints" ADD COLUMN "worker_profile_id" UUID;
ALTER TABLE "complaint_locations" ADD COLUMN "exact_coordinates_auth_tag" BYTEA,
  ADD COLUMN "exact_coordinates_aad_context" VARCHAR(160),
  ADD COLUMN "crypto_version" SMALLINT;
ALTER TABLE "evidence_assets" ADD COLUMN "recorded_at" TIMESTAMPTZ(3),
  ADD COLUMN "duration_ms" INTEGER;

CREATE TABLE "private_reporter_fields" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "complaint_id" UUID NOT NULL,
  "kind" VARCHAR(16) NOT NULL, "ciphertext" BYTEA NOT NULL, "nonce" BYTEA NOT NULL,
  "auth_tag" BYTEA NOT NULL, "aad_context" VARCHAR(160) NOT NULL,
  "key_id" VARCHAR(100) NOT NULL, "algorithm" VARCHAR(32) NOT NULL,
  "display_suffix" VARCHAR(8) NOT NULL, "crypto_version" SMALLINT NOT NULL DEFAULT 1,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "private_reporter_fields_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "private_reporter_fields_complaint_kind_key" ON "private_reporter_fields"("complaint_id", "kind");
ALTER TABLE "private_reporter_fields" ADD CONSTRAINT "private_reporter_fields_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "worker_identity_profiles" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "phone_blind_index" VARCHAR(128) NOT NULL,
  "cnic_blind_index" VARCHAR(128), "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "worker_identity_profiles_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "worker_identity_profiles_phone_blind_key" ON "worker_identity_profiles"("phone_blind_index");
CREATE INDEX "worker_identity_profiles_cnic_blind_idx" ON "worker_identity_profiles"("cnic_blind_index");

CREATE TABLE "worker_history_sessions" (
  "id" UUID NOT NULL DEFAULT uuidv7(), "profile_id" UUID NOT NULL,
  "token_hash" VARCHAR(128) NOT NULL, "issued_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "expires_at" TIMESTAMPTZ(3) NOT NULL, "revoked_at" TIMESTAMPTZ(3),
  CONSTRAINT "worker_history_sessions_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "worker_history_sessions_token_hash_key" ON "worker_history_sessions"("token_hash");
CREATE INDEX "worker_history_sessions_profile_revoked_idx" ON "worker_history_sessions"("profile_id", "revoked_at");
ALTER TABLE "worker_history_sessions" ADD CONSTRAINT "worker_history_sessions_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "worker_identity_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "complaints_worker_profile_submitted_idx" ON "complaints"("worker_profile_id", "submitted_at" DESC);
ALTER TABLE "complaints" ADD CONSTRAINT "complaints_worker_profile_id_fkey" FOREIGN KEY ("worker_profile_id") REFERENCES "worker_identity_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
