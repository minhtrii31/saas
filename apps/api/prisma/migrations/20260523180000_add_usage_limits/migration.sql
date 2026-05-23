-- CreateEnum
CREATE TYPE "usage_action" AS ENUM ('CV_ANALYSIS', 'JD_MATCH', 'COVER_LETTER', 'RESUME_REWRITE', 'REWRITE_REFINEMENT');

-- AlterTable
ALTER TABLE "users" ADD COLUMN "credit_balance" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "usage_records" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "action" "usage_action" NOT NULL,
    "credits_used" INTEGER NOT NULL,
    "cv_analysis_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usage_records_cv_analysis_id_key" ON "usage_records"("cv_analysis_id");

-- CreateIndex
CREATE INDEX "usage_records_user_id_idx" ON "usage_records"("user_id");

-- CreateIndex
CREATE INDEX "usage_records_action_idx" ON "usage_records"("action");

-- CreateIndex
CREATE INDEX "usage_records_created_at_idx" ON "usage_records"("created_at");

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_records" ADD CONSTRAINT "usage_records_cv_analysis_id_fkey" FOREIGN KEY ("cv_analysis_id") REFERENCES "cv_analyses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
