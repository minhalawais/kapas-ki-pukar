CREATE TABLE "upload_sessions" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "token_hash" VARCHAR(128) NOT NULL,
    "client_submission_id" VARCHAR(100) NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "original_name" VARCHAR(255) NOT NULL,
    "declared_mime_type" VARCHAR(100) NOT NULL,
    "detected_mime_type" VARCHAR(100),
    "max_bytes" BIGINT NOT NULL,
    "received_bytes" BIGINT NOT NULL DEFAULT 0,
    "status" VARCHAR(24) NOT NULL DEFAULT 'created',
    "quarantine_path" TEXT NOT NULL,
    "sha256_digest" BYTEA,
    "expires_at" TIMESTAMPTZ(3) NOT NULL,
    "completed_at" TIMESTAMPTZ(3),
    "attached_at" TIMESTAMPTZ(3),
    "encryption_key_id" VARCHAR(100),
    "encryption_algorithm" VARCHAR(32),
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "upload_sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "upload_sessions_token_hash_key" ON "upload_sessions"("token_hash");
CREATE INDEX "upload_sessions_submission_status_idx" ON "upload_sessions"("client_submission_id", "status");
CREATE INDEX "upload_sessions_expiry_status_idx" ON "upload_sessions"("expires_at", "status");
