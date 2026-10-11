-- Sistema de tickets: roles, estados/prioridades/categorías como enums,
-- asignación, comentarios e historial. Escrita para conservar los datos de la
-- migración inicial (renombra columnas en lugar de borrarlas).

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'AGENT', 'USER');

-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED');

-- CreateEnum
CREATE TYPE "TicketPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'URGENT');

-- CreateEnum
CREATE TYPE "TicketCategory" AS ENUM ('GENERAL', 'TECHNICAL', 'BILLING', 'ACCOUNT', 'FEATURE_REQUEST');

-- CreateEnum
CREATE TYPE "TicketEventType" AS ENUM ('CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'ASSIGNED');

-- User: nombre obligatorio, contraseña, rol y estado de la cuenta.
-- Las cuentas previas quedan sin contraseña válida (hash vacío) y deben restablecerse.
UPDATE "User" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL;
ALTER TABLE "User"
  ALTER COLUMN "name" SET NOT NULL,
  ADD COLUMN "passwordHash" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "role" "Role" NOT NULL DEFAULT 'USER',
  ADD COLUMN "active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP DEFAULT;

-- Ticket: content -> description, userId -> authorId, status TEXT -> enum.
ALTER TABLE "Ticket" RENAME COLUMN "content" TO "description";
ALTER TABLE "Ticket" RENAME COLUMN "userId" TO "authorId";
ALTER TABLE "Ticket" RENAME CONSTRAINT "Ticket_userId_fkey" TO "Ticket_authorId_fkey";

ALTER TABLE "Ticket" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Ticket" ALTER COLUMN "status" TYPE "TicketStatus" USING (
  CASE
    WHEN "status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED') THEN "status"
    ELSE 'OPEN'
  END
)::"TicketStatus";
ALTER TABLE "Ticket" ALTER COLUMN "status" SET DEFAULT 'OPEN';

ALTER TABLE "Ticket"
  ADD COLUMN "number" SERIAL NOT NULL,
  ADD COLUMN "priority" "TicketPriority" NOT NULL DEFAULT 'MEDIUM',
  ADD COLUMN "category" "TicketCategory" NOT NULL DEFAULT 'GENERAL',
  ADD COLUMN "assigneeId" TEXT;

-- CreateTable
CREATE TABLE "Comment" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketEvent" (
    "id" TEXT NOT NULL,
    "type" "TicketEventType" NOT NULL,
    "fromValue" TEXT,
    "toValue" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ticketId" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,

    CONSTRAINT "TicketEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Ticket_number_key" ON "Ticket"("number");

-- CreateIndex
CREATE INDEX "Ticket_status_idx" ON "Ticket"("status");

-- CreateIndex
CREATE INDEX "Ticket_priority_idx" ON "Ticket"("priority");

-- CreateIndex
CREATE INDEX "Ticket_authorId_idx" ON "Ticket"("authorId");

-- CreateIndex
CREATE INDEX "Ticket_assigneeId_idx" ON "Ticket"("assigneeId");

-- CreateIndex
CREATE INDEX "Ticket_createdAt_idx" ON "Ticket"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_ticketId_createdAt_idx" ON "Comment"("ticketId", "createdAt");

-- CreateIndex
CREATE INDEX "TicketEvent_ticketId_createdAt_idx" ON "TicketEvent"("ticketId", "createdAt");

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketEvent" ADD CONSTRAINT "TicketEvent_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
