-- Additive migration: link Invoice to its related Payment (auto-hide paid invoices + access control)
ALTER TABLE "invoices" ADD COLUMN IF NOT EXISTS "relatedPaymentId" TEXT;

CREATE INDEX IF NOT EXISTS "invoices_relatedPaymentId_idx" ON "invoices"("relatedPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "invoices_relatedPaymentId_key" ON "invoices"("relatedPaymentId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'invoices_relatedPaymentId_fkey'
  ) THEN
    ALTER TABLE "invoices" ADD CONSTRAINT "invoices_relatedPaymentId_fkey" FOREIGN KEY ("relatedPaymentId") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;