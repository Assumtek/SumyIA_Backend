-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "utilidade" INTEGER NOT NULL,
    "facilidade" INTEGER NOT NULL,
    "design" INTEGER NOT NULL,
    "confiabilidade" INTEGER NOT NULL,
    "recomendacao" INTEGER NOT NULL,
    "valorJusto" INTEGER NOT NULL,
    "recursoFaltando" TEXT NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
