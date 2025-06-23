-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "handledBy" TEXT DEFAULT 'Self-assigned',
ADD COLUMN     "passedTime" INTEGER DEFAULT 0;
