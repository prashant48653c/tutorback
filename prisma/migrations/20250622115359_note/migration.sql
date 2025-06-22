-- CreateTable
CREATE TABLE "PauseNote" (
    "id" SERIAL NOT NULL,
    "pausedAt" TIMESTAMP(3) NOT NULL,
    "note" TEXT NOT NULL DEFAULT 'No note',
    "projectId" INTEGER NOT NULL,

    CONSTRAINT "PauseNote_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "PauseNote" ADD CONSTRAINT "PauseNote_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
