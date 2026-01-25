-- Ejecuta esto en PostgreSQL para limpiar TODAS las relaciones rotas

-- Eliminar calificaciones con student_id inválido
DELETE FROM calificaciones 
WHERE student_id NOT IN (SELECT id FROM students);

-- Eliminar calificaciones con materia_id inválido
DELETE FROM calificaciones 
WHERE materia_id NOT IN (SELECT id FROM materias);

-- Eliminar calificaciones con ano_escolar_id inválido
DELETE FROM calificaciones 
WHERE ano_escolar_id NOT IN (SELECT id FROM anos_escolares);

-- Agregar columna deleted_at a users
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

-- Verificar que quedó limpio
SELECT 'Calificaciones restantes:' as info, COUNT(*) as count FROM calificaciones;
