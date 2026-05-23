-- CreateEnum
CREATE TYPE "application_status" AS ENUM ('SAVED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED');

-- AlterEnum
ALTER TYPE "analysis_type" ADD VALUE 'APPLICATION_FOLLOW_UP';

-- AlterEnum
ALTER TYPE "usage_action" ADD VALUE 'APPLICATION_FOLLOW_UP';

-- CreateTable
CREATE TABLE "applications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "cv_id" UUID NOT NULL,
    "job_target_id" UUID,
    "company_name" TEXT NOT NULL,
    "role_title" TEXT NOT NULL,
    "status" "application_status" NOT NULL DEFAULT 'SAVED',
    "applied_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "applications_user_id_idx" ON "applications"("user_id");

-- CreateIndex
CREATE INDEX "applications_cv_id_idx" ON "applications"("cv_id");

-- CreateIndex
CREATE INDEX "applications_job_target_id_idx" ON "applications"("job_target_id");

-- CreateIndex
CREATE INDEX "applications_status_idx" ON "applications"("status");

-- CreateIndex
CREATE INDEX "applications_deleted_at_idx" ON "applications"("deleted_at");

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_cv_id_fkey" FOREIGN KEY ("cv_id") REFERENCES "cvs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "applications" ADD CONSTRAINT "applications_job_target_id_fkey" FOREIGN KEY ("job_target_id") REFERENCES "job_targets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
