-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('DIRECTOR', 'CONTROL_ESTUDIOS', 'DOCENTE', 'ADMIN');

-- CreateEnum
CREATE TYPE "StudentStatus" AS ENUM ('ACTIVO', 'RETIRADO', 'GRADUADO', 'INACTIVO');

-- CreateEnum
CREATE TYPE "TeacherStatus" AS ENUM ('ACTIVO', 'INACTIVO');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "UserRole" NOT NULL,
    "teacher_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'info',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT,
    "genero" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "lugar_nacimiento" TEXT,
    "direccion" TEXT,
    "telefono" TEXT,
    "nombre_representante" TEXT,
    "cedula_representante" TEXT,
    "telefono_representante" TEXT,
    "email_representante" TEXT,
    "observaciones" TEXT,
    "id_grado" INTEGER,
    "id_seccion" INTEGER,
    "status" "StudentStatus" NOT NULL DEFAULT 'ACTIVO',
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teachers" (
    "id" SERIAL NOT NULL,
    "nacionalidad" TEXT NOT NULL,
    "cedula" TEXT NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" "TeacherStatus" NOT NULL DEFAULT 'ACTIVO',

    CONSTRAINT "teachers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materias" (
    "id" SERIAL NOT NULL,
    "nombre_materia" TEXT NOT NULL,
    "id_docente" INTEGER,
    "id_grado" INTEGER,
    "id_seccion" INTEGER,

    CONSTRAINT "materias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grados" (
    "id_grado" SERIAL NOT NULL,
    "nombre_grado" TEXT NOT NULL,

    CONSTRAINT "grados_pkey" PRIMARY KEY ("id_grado")
);

-- CreateTable
CREATE TABLE "secciones" (
    "id_seccion" SERIAL NOT NULL,
    "nombre_seccion" TEXT NOT NULL,

    CONSTRAINT "secciones_pkey" PRIMARY KEY ("id_seccion")
);

-- CreateTable
CREATE TABLE "anos_escolares" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "anos_escolares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calificaciones" (
    "id" SERIAL NOT NULL,
    "student_id" INTEGER NOT NULL,
    "materia_id" INTEGER NOT NULL,
    "ano_escolar_id" INTEGER NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "calificaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evaluations" (
    "id" SERIAL NOT NULL,
    "calificacion_id" INTEGER NOT NULL,
    "lapso" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "nota" DECIMAL(5,2) NOT NULL,
    "ponderacion" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_teacher_id_idx" ON "users"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_cedula_key" ON "students"("cedula");

-- CreateIndex
CREATE INDEX "students_id_grado_idx" ON "students"("id_grado");

-- CreateIndex
CREATE INDEX "students_id_seccion_idx" ON "students"("id_seccion");

-- CreateIndex
CREATE UNIQUE INDEX "teachers_cedula_key" ON "teachers"("cedula");

-- CreateIndex
CREATE INDEX "materias_id_docente_idx" ON "materias"("id_docente");

-- CreateIndex
CREATE INDEX "materias_id_grado_idx" ON "materias"("id_grado");

-- CreateIndex
CREATE INDEX "materias_id_seccion_idx" ON "materias"("id_seccion");

-- CreateIndex
CREATE INDEX "calificaciones_student_id_idx" ON "calificaciones"("student_id");

-- CreateIndex
CREATE INDEX "calificaciones_materia_id_idx" ON "calificaciones"("materia_id");

-- CreateIndex
CREATE INDEX "calificaciones_ano_escolar_id_idx" ON "calificaciones"("ano_escolar_id");

-- CreateIndex
CREATE UNIQUE INDEX "calificaciones_student_id_materia_id_ano_escolar_id_key" ON "calificaciones"("student_id", "materia_id", "ano_escolar_id");

-- CreateIndex
CREATE INDEX "evaluations_calificacion_id_idx" ON "evaluations"("calificacion_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teachers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grados"("id_grado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_id_seccion_fkey" FOREIGN KEY ("id_seccion") REFERENCES "secciones"("id_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_id_docente_fkey" FOREIGN KEY ("id_docente") REFERENCES "teachers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_id_grado_fkey" FOREIGN KEY ("id_grado") REFERENCES "grados"("id_grado") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materias" ADD CONSTRAINT "materias_id_seccion_fkey" FOREIGN KEY ("id_seccion") REFERENCES "secciones"("id_seccion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_materia_id_fkey" FOREIGN KEY ("materia_id") REFERENCES "materias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calificaciones" ADD CONSTRAINT "calificaciones_ano_escolar_id_fkey" FOREIGN KEY ("ano_escolar_id") REFERENCES "anos_escolares"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evaluations" ADD CONSTRAINT "evaluations_calificacion_id_fkey" FOREIGN KEY ("calificacion_id") REFERENCES "calificaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;
