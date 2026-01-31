import { Router } from 'express';
import * as GradesController from '../controllers/grades.controller';
import * as DashboardController from '../controllers/dashboard.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();
router.use(authenticateToken);

// Dashboard
router.get('/initial-data', asyncHandler(DashboardController.getInitialData));

// Grades
router.post('/calificaciones/sync', asyncHandler(GradesController.syncGrades));
router.post('/calificaciones/lock-status', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR']), asyncHandler(GradesController.setLockStatus));

// Reports
router.get('/reports/boletin', asyncHandler(GradesController.getBoletin));
router.get('/reports/acta', asyncHandler(GradesController.getActa));
router.get('/reports/export-xlsx', asyncHandler(GradesController.exportXlsx));


export default router;
