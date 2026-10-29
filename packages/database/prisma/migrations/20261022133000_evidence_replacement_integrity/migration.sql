CREATE INDEX "evidence_declarations_replacement_for_idx"
  ON "evidence_declarations"("replacement_for_id");

ALTER TABLE "evidence_declarations"
  ADD CONSTRAINT "evidence_declarations_replacement_for_id_fkey"
  FOREIGN KEY ("replacement_for_id") REFERENCES "evidence_declarations"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
