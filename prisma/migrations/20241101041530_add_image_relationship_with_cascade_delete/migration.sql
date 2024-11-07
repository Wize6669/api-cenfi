-- AddForeignKey
ALTER TABLE "Imagen" ADD CONSTRAINT "Imagen_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
