ALTER TABLE "ai_analysis_runs"
  ADD COLUMN "input_hash" VARCHAR(128) NOT NULL DEFAULT 'legacy',
  ADD COLUMN "provider_region" VARCHAR(80),
  ADD COLUMN "latency_ms" INTEGER,
  ADD COLUMN "token_count" INTEGER,
  ADD COLUMN "cost_minor_units" INTEGER,
  ADD COLUMN "safety_warnings" JSONB NOT NULL DEFAULT '[]';

ALTER TABLE "outbox_events"
  ADD COLUMN "locked_by" VARCHAR(100),
  ADD COLUMN "locked_at" TIMESTAMPTZ(3);

CREATE TABLE "notification_deliveries" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "complaint_id" UUID,
  "event_id" UUID,
  "template_id" VARCHAR(100) NOT NULL,
  "template_version" VARCHAR(32) NOT NULL,
  "locale" VARCHAR(12) NOT NULL,
  "channel" VARCHAR(16) NOT NULL,
  "destination_ref" VARCHAR(128),
  "reason" VARCHAR(120) NOT NULL,
  "state" VARCHAR(24) NOT NULL DEFAULT 'pending',
  "provider_message_id" VARCHAR(160),
  "attempt_count" INTEGER NOT NULL DEFAULT 0,
  "last_error_code" VARCHAR(100),
  "consent_snapshot" JSONB NOT NULL,
  "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "delivered_at" TIMESTAMPTZ(3),
  CONSTRAINT "notification_deliveries_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notification_deliveries_channel_check" CHECK ("channel" IN ('sms','push')),
  CONSTRAINT "notification_deliveries_state_check" CHECK ("state" IN ('pending','accepted','delivered','failed','unknown'))
);
CREATE INDEX "notification_deliveries_state_updated_idx" ON "notification_deliveries" ("state", "updated_at");
CREATE INDEX "notification_deliveries_complaint_at_idx" ON "notification_deliveries" ("complaint_id", "created_at" DESC);
ALTER TABLE "notification_deliveries" ADD CONSTRAINT "notification_deliveries_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "provider_webhook_events" (
  "id" UUID NOT NULL DEFAULT uuidv7(),
  "provider" VARCHAR(50) NOT NULL,
  "provider_id" VARCHAR(160) NOT NULL,
  "event_type" VARCHAR(100) NOT NULL,
  "received_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "provider_webhook_events_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "provider_webhook_events_provider_id_key" ON "provider_webhook_events" ("provider", "provider_id");
CREATE INDEX "provider_webhook_events_received_idx" ON "provider_webhook_events" ("received_at");

CREATE TABLE "maintenance_locks" (
  "name" VARCHAR(100) NOT NULL,
  "owner" VARCHAR(100) NOT NULL,
  "expires_at" TIMESTAMPTZ(3) NOT NULL,
  "updated_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "maintenance_locks_pkey" PRIMARY KEY ("name")
);
