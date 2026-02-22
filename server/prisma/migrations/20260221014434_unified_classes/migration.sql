-- AlterTable
ALTER TABLE "grados" ADD COLUMN     "ano_escolar_id" INTEGER;

-- AlterTable
ALTER TABLE "secciones" ADD COLUMN     "id_grado" INTEGER;

-- AddForeignKey
ALTER TABLE "grados" ADD CONSTRAINT "grados_ano_escolar_id_fkey" FOREIGN KEY ("ano_escolar_id") REFERENCES "anos_escolares"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "secciones" ADD CONSTRAINT "secciones_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grados"("id_grado") ON DELETE SET NULL ON UPDATE CASCADE;
