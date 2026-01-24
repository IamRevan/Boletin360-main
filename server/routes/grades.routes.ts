import { Router } from 'express';
import * as GradesController from '../controllers/grades.controller';
import * as DashboardController from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);

// Dashboard
router.get('/initial-data', DashboardController.getInitialData);

// Grades
router.post('/calificaciones/sync', GradesController.syncGrades);
router.post('/calificaciones/lock-status', authorizeRole(['Admin', 'Control de Estudios', 'Director']), GradesController.setLockStatus);

// Reports
router.get('/reports/boletin', GradesController.getBoletin);
router.get('/reports/acta', GradesController.getActa);
router.get('/reports/export-xlsx', GradesController.exportXlsx);

export default router;
