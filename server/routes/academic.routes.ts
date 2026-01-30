import { Router } from 'express';
import * as AcademicController from '../controllers/academic.controller';
import * as SubjectsController from '../controllers/subjects.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();
router.use(authenticateToken); // Protect all

// Grados
const gradosRouter = Router();
gradosRouter.post('/', AcademicController.createGrado);
gradosRouter.put('/:id', AcademicController.updateGrado);
gradosRouter.delete('/:id', AcademicController.deleteGrado);
router.use('/grados', gradosRouter);

// Secciones
const seccionesRouter = Router();
seccionesRouter.post('/', AcademicController.createSeccion);
seccionesRouter.put('/:id', AcademicController.updateSeccion);
seccionesRouter.delete('/:id', AcademicController.deleteSeccion);
router.use('/secciones', seccionesRouter);

// School Years
const yearsRouter = Router();
yearsRouter.post('/', authorizeRole(['ADMIN']), AcademicController.createSchoolYear);
yearsRouter.put('/:id', authorizeRole(['ADMIN']), AcademicController.updateSchoolYear);
yearsRouter.delete('/:id', authorizeRole(['ADMIN']), AcademicController.deleteSchoolYear);
router.use('/schoolyears', yearsRouter);

// Materias
const materiasRouter = Router();
materiasRouter.post('/', SubjectsController.createMateria);
materiasRouter.put('/:id', SubjectsController.updateMateria);
materiasRouter.delete('/:id', SubjectsController.deleteMateria);
router.use('/materias', materiasRouter);

export default router;
