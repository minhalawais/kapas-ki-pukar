CREATE TABLE "export_jobs" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "requested_by" UUID NOT NULL,
  "purpose" VARCHAR(240) NOT NULL,
  "format" VARCHAR(16) NOT NULL,
  "filters" JSONB NOT NULL,
  "fields" JSONB NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'queued',
  "file_path" TEXT,
  "row_count" INTEGER NOT NULL DEFAULT 0,
  "failure_code" VARCHAR(100),
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completed_at" TIMESTAMPTZ(3),
  "downloaded_at" TIMESTAMPTZ(3),
  CONSTRAINT "export_jobs_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "export_jobs_format_check" CHECK ("format" IN ('csv')),
  CONSTRAINT "export_jobs_status_check" CHECK ("status" IN ('queued','processing','ready','failed','expired'))
);
CREATE INDEX "export_jobs_status_expiry_idx" ON "export_jobs" ("status", "expires_at");
CREATE INDEX "export_jobs_requester_created_idx" ON "export_jobs" ("requested_by", "created_at" DESC);
ALTER TABLE "export_jobs" ADD CONSTRAINT "export_jobs_requested_by_fkey" FOREIGN KEY ("requested_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "legal_holds" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "complaint_id" UUID NOT NULL,
  "reason" VARCHAR(500) NOT NULL,
  "placed_by" UUID NOT NULL,
  "active" BOOLEAN NOT NULL DEFAULT true,
  "placed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "released_at" TIMESTAMPTZ(3),
  "released_by" UUID,
  CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "legal_holds_complaint_id_key" UNIQUE ("complaint_id")
);
CREATE INDEX "legal_holds_active_idx" ON "legal_holds" ("active", "placed_at");
ALTER TABLE "legal_holds" ADD CONSTRAINT "legal_holds_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "retention_dispositions" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "complaint_id" UUID NOT NULL,
  "data_class" VARCHAR(80) NOT NULL,
  "action" VARCHAR(32) NOT NULL,
  "status" VARCHAR(24) NOT NULL DEFAULT 'planned',
  "reason" VARCHAR(240) NOT NULL,
  "completed_at" TIMESTAMPTZ(3),
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "retention_dispositions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "retention_dispositions_status_idx" ON "retention_dispositions" ("status", "created_at");
CREATE INDEX "retention_dispositions_complaint_class_idx" ON "retention_dispositions" ("complaint_id", "data_class");
ALTER TABLE "retention_dispositions" ADD CONSTRAINT "retention_dispositions_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "data_quality_findings" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "check_key" VARCHAR(100) NOT NULL,
  "entity_type" VARCHAR(50) NOT NULL,
  "entity_id" UUID,
  "severity" VARCHAR(16) NOT NULL,
  "details" JSONB NOT NULL,
  "observed_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMPTZ(3),
  CONSTRAINT "data_quality_findings_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "data_quality_findings_check_idx" ON "data_quality_findings" ("check_key", "observed_at" DESC);
CREATE INDEX "data_quality_findings_open_idx" ON "data_quality_findings" ("severity", "resolved_at");
