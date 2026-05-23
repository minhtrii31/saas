-- CreateTable
CREATE TABLE "job_targets" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "job_description_text" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "job_targets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_targets_user_id_idx" ON "job_targets"("user_id");

-- CreateIndex
CREATE INDEX "job_targets_deleted_at_idx" ON "job_targets"("deleted_at");

-- AddForeignKey
ALTER TABLE "job_targets" ADD CONSTRAINT "job_targets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
