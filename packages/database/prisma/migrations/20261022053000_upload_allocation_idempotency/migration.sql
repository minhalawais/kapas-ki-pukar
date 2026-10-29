ALTER TABLE "upload_sessions"
  ADD COLUMN "client_media_id" VARCHAR(100);

CREATE INDEX "upload_sessions_client_media_idx"
  ON "upload_sessions"("client_submission_id", "client_media_id");

CREATE UNIQUE INDEX "upload_sessions_active_client_media_key"
  ON "upload_sessions"("client_submission_id", "client_media_id")
  WHERE "client_media_id" IS NOT NULL
    AND "status" IN ('created', 'uploading', 'processing', 'complete');
