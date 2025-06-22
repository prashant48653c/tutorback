/*
  Warnings:

  - Added the required column `password` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "image1" TEXT,
ADD COLUMN     "image2" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "password" TEXT NOT NULL;
