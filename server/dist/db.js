"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDB = exports.query = void 0;
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
// Configuración del pool de conexión a PostgreSQL
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
});
// Función genérica para ejecutar consultas SQL
const query = (text, params) => pool.query(text, params);
exports.query = query;
// Función para inicializar la base de datos (Crear tablas y datos iniciales)
const initDB = async () => {
    try {
        console.log('Inicializando base de datos...');
        // Tabla de Usuarios del sistema (Admin, Docentes, etc.)
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS users(
      id SERIAL PRIMARY KEY,
      nombres VARCHAR(255) NOT NULL,
      apellidos VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL,
      teacher_id INTEGER
    );
    `);
        // Tabla de Grados (1er Año, etc.)
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS grados(
      id_grado SERIAL PRIMARY KEY,
      nombre_grado VARCHAR(255) NOT NULL
    );
    `);
        // Tabla de Secciones (A, B, C)
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS secciones(
      id_seccion SERIAL PRIMARY KEY,
      nombre_seccion VARCHAR(255) NOT NULL
    );
    `);
        // Tabla de Estudiantes
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS students(
      id SERIAL PRIMARY KEY,
      nacionalidad VARCHAR(1) NOT NULL,
      cedula VARCHAR(20) NOT NULL,
      nombres VARCHAR(255) NOT NULL,
      apellidos VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      genero VARCHAR(1) NOT NULL,
      fecha_nacimiento DATE,
      id_grado INTEGER REFERENCES grados(id_grado),
      id_seccion INTEGER REFERENCES secciones(id_seccion),
      status VARCHAR(50) NOT NULL,
      deleted_at TIMESTAMP
    );
    `);
        // Migración para Soft Delete (Asegura que la columna exista si la DB ya fue creada)
        try {
            await (0, exports.query)('ALTER TABLE students ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP');
        }
        catch (e) {
            console.log('Error agregando columna deleted_at (puede que ya exista o la tabla esté ocupada)', e);
        }
        // Tabla de Docentes
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS teachers(
      id SERIAL PRIMARY KEY,
      nacionalidad VARCHAR(1) NOT NULL,
      cedula VARCHAR(20) NOT NULL,
      nombres VARCHAR(255) NOT NULL,
      apellidos VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL
    );
    `);
        // Tabla de Materias
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS materias(
      id SERIAL PRIMARY KEY,
      nombre_materia VARCHAR(255) NOT NULL,
      id_docente INTEGER REFERENCES teachers(id),
      id_grado INTEGER REFERENCES grados(id_grado),
      id_seccion INTEGER REFERENCES secciones(id_seccion)
    );
    `);
        // Tabla de Años Escolares
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS anos_escolares(
      id SERIAL PRIMARY KEY,
      nombre VARCHAR(255) NOT NULL
    );
    `);
        // Tabla de Calificaciones
        // Almacena los lapsos como JSONB para simplificar la estructura y coincidir con el frontend
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS calificaciones(
      student_id INTEGER REFERENCES students(id),
      materia_id INTEGER REFERENCES materias(id),
      ano_escolar_id INTEGER REFERENCES anos_escolares(id),
      lapso1 JSONB DEFAULT '[]',
      lapso2 JSONB DEFAULT '[]',
      lapso3 JSONB DEFAULT '[]',
      PRIMARY KEY(student_id, materia_id, ano_escolar_id)
    );
    `);
        // Tabla de Auditoría (Audit Logs)
        await (0, exports.query)(`
      CREATE TABLE IF NOT EXISTS audit_logs(
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      action VARCHAR(255) NOT NULL,
      details TEXT,
      timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    `);
        // Datos Semilla (Seed Data)
        const usersCount = await (0, exports.query)('SELECT COUNT(*) FROM users');
        if (parseInt(usersCount.rows[0].count) === 0) {
            console.log('Sembrando usuarios por defecto...');
            const hashedPassword = bcryptjs_1.default.hashSync('password', 10);
            await (0, exports.query)(`INSERT INTO users(nombres, apellidos, email, password, role) VALUES('Admin', 'Principal', 'admin@boletin360.com', $1, 'Admin')`, [hashedPassword]);
        }
        const gradosCount = await (0, exports.query)('SELECT COUNT(*) FROM grados');
        if (parseInt(gradosCount.rows[0].count) === 0) {
            console.log('Sembrando grados...');
            await (0, exports.query)(`INSERT INTO grados(nombre_grado) VALUES('1er Año'), ('2do Año'), ('3er Año'), ('4to Año'), ('5to Año')`);
        }
        const seccionesCount = await (0, exports.query)('SELECT COUNT(*) FROM secciones');
        if (parseInt(seccionesCount.rows[0].count) === 0) {
            console.log('Sembrando secciones...');
            await (0, exports.query)(`INSERT INTO secciones(nombre_seccion) VALUES('A'), ('B'), ('C')`);
        }
        const anosCount = await (0, exports.query)('SELECT COUNT(*) FROM anos_escolares');
        if (parseInt(anosCount.rows[0].count) === 0) {
            console.log('Sembrando años escolares...');
            await (0, exports.query)(`INSERT INTO anos_escolares(nombre) VALUES('2023-2024'), ('2024-2025')`);
        }
        console.log('Base de datos inicializada correctamente.');
    }
    catch (err) {
        console.error('Error al inicializar la base de datos:', err);
    }
};
exports.initDB = initDB;
