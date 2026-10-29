ALTER TABLE "upload_sessions"
  ADD COLUMN "expected_bytes" BIGINT,
  ADD COLUMN "final_object_path" TEXT,
  ADD COLUMN "scan_state" VARCHAR(24) NOT NULL DEFAULT 'pending',
  ADD COLUMN "scan_engine" VARCHAR(64),
  ADD COLUMN "scan_engine_version" VARCHAR(64),
  ADD COLUMN "scan_result_code" VARCHAR(100),
  ADD COLUMN "scanned_at" TIMESTAMPTZ(3),
  ADD COLUMN "rejection_code" VARCHAR(100),
  ADD COLUMN "last_activity_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE "upload_sessions"
SET "expected_bytes" = "received_bytes"
WHERE "status" IN ('complete', 'attached') AND "expected_bytes" IS NULL;

CREATE INDEX "upload_sessions_activity_idx"
  ON "upload_sessions" ("status", "last_activity_at");

ALTER TABLE "upload_sessions"
  ADD CONSTRAINT "upload_sessions_status_v2_check"
  CHECK ("status" IN ('created','uploading','processing','complete','rejected','expired','attached'));

ALTER TABLE "upload_sessions"
  ADD CONSTRAINT "upload_sessions_scan_state_check"
  CHECK ("scan_state" IN ('pending','scanning','clean','infected','failed'));
