-- AlterTable
ALTER TABLE "agent_memories" ADD COLUMN     "user_id" INTEGER,
ALTER COLUMN "session_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "agent_memories" ADD CONSTRAINT "agent_memories_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
