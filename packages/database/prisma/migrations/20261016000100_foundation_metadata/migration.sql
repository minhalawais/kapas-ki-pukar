-- Phase 02 contains deployment metadata only. Complaint business tables begin in Phase 03.
CREATE TABLE "system_metadata" (
    "key" VARCHAR(100) NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "system_metadata_pkey" PRIMARY KEY ("key")
);
