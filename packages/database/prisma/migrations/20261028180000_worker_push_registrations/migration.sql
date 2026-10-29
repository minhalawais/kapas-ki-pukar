CREATE TABLE "worker_push_registrations" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "expo_push_token" VARCHAR(255) NOT NULL,
    "token_fingerprint" VARCHAR(64) NOT NULL,
    "platform" VARCHAR(16) NOT NULL,
    "locale" VARCHAR(12) NOT NULL DEFAULT 'en',
    "device_install_id" VARCHAR(64),
    "registered_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revoked_at" TIMESTAMPTZ(3),

    CONSTRAINT "worker_push_registrations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worker_push_registrations_token_fp_key" ON "worker_push_registrations"("token_fingerprint");
CREATE INDEX "worker_push_registrations_complaint_idx" ON "worker_push_registrations"("complaint_id", "revoked_at");

ALTER TABLE "worker_push_registrations" ADD CONSTRAINT "worker_push_registrations_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
