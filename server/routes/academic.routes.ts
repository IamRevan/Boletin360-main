import { Router } from 'express';
import * as AcademicController from '../controllers/academic.controller';
import * as SubjectsController from '../controllers/subjects.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken); // Protect all

// Grados
const gradosRouter = Router();
gradosRouter.post('/', asyncHandler(AcademicController.createGrado));
gradosRouter.put('/:id', asyncHandler(AcademicController.updateGrado));
gradosRouter.delete('/:id', asyncHandler(AcademicController.deleteGrado));
router.use('/grados', gradosRouter);

// Secciones
const seccionesRouter = Router();
seccionesRouter.post('/', asyncHandler(AcademicController.createSeccion));
seccionesRouter.put('/:id', asyncHandler(AcademicController.updateSeccion));
seccionesRouter.delete('/:id', asyncHandler(AcademicController.deleteSeccion));
router.use('/secciones', seccionesRouter);

// School Years
const yearsRouter = Router();
yearsRouter.post('/', authorizeRole(['ADMIN']), asyncHandler(AcademicController.createSchoolYear));
yearsRouter.put('/:id', authorizeRole(['ADMIN']), asyncHandler(AcademicController.updateSchoolYear));
yearsRouter.delete('/:id', authorizeRole(['ADMIN']), asyncHandler(AcademicController.deleteSchoolYear));
router.use('/schoolyears', yearsRouter);

// Materias
const materiasRouter = Router();
materiasRouter.post('/', asyncHandler(SubjectsController.createMateria));
materiasRouter.put('/:id', asyncHandler(SubjectsController.updateMateria));
materiasRouter.delete('/:id', asyncHandler(SubjectsController.deleteMateria));
router.use('/materias', materiasRouter);

export default router;

