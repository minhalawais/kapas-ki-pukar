CREATE TABLE "worker_information_responses" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "complaint_id" UUID NOT NULL,
    "request_id" VARCHAR(100) NOT NULL,
    "response_data" JSONB NOT NULL,
    "submitted_at" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "worker_information_responses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "worker_information_responses_complaint_request_key" ON "worker_information_responses"("complaint_id", "request_id");
CREATE INDEX "worker_information_responses_complaint_at_idx" ON "worker_information_responses"("complaint_id", "submitted_at" DESC);
ALTER TABLE "worker_information_responses" ADD CONSTRAINT "worker_information_responses_complaint_id_fkey" FOREIGN KEY ("complaint_id") REFERENCES "complaints"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
