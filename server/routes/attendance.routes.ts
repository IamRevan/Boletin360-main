import { Router } from 'express';
import { getAttendanceByDate, saveAttendance, getStudentAttendanceHistory, getAttendanceSummary } from '../controllers/attendance.controller';
import { authenticateToken, authorizeRole } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';

const router = Router();

router.use(authenticateToken);

router.get('/', asyncHandler(getAttendanceByDate));
router.post('/', authorizeRole(['ADMIN', 'CONTROL_ESTUDIOS', 'DIRECTOR', 'DOCENTE']), asyncHandler(saveAttendance));
router.get('/summary', asyncHandler(getAttendanceSummary));
router.get('/student/:studentId', asyncHandler(getStudentAttendanceHistory));

export default router;
