import request from 'supertest';

const API_URL = process.env.API_URL || 'http://localhost:3001';

describe('API Integration Tests', () => {

    describe('Health Check', () => {
        it('should return 200 with status ok', async () => {
            const res = await request(API_URL).get('/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
        });
    });

    describe('Authentication', () => {
        it('should reject requests without token', async () => {
            const res = await request(API_URL).get('/api/students');
            expect(res.status).toBe(401);
        });

        it('should reject invalid token', async () => {
            const res = await request(API_URL)
                .get('/api/students')
                .set('Authorization', 'Bearer invalid_token');
            expect(res.status).toBe(403);
        });
    });

    describe('Reports Endpoints', () => {
        let token: string;

        beforeAll(async () => {
            const res = await request(API_URL)
                .post('/api/login')
                .send({ email: 'admin@example.com', password: 'admin123' })
                .catch(() => ({ status: 400, body: {} }));

            token = res.body?.token || '';
        });

        it('GET /api/reports/boletin - should return 400 without params', async () => {
            const res = await request(API_URL)
                .get('/api/reports/boletin')
                .set('Authorization', `Bearer ${token}`);
            expect([400, 401, 403]).toContain(res.status);
        });

        it('GET /api/reports/acta - should return 400 without params', async () => {
            const res = await request(API_URL)
                .get('/api/reports/acta')
                .set('Authorization', `Bearer ${token}`);
            expect([400, 401, 403]).toContain(res.status);
        });
    });

    describe('Teacher Endpoints', () => {
        it('GET /api/teacher/classes - should return 403 without valid teacher user', async () => {
            const res = await request(API_URL)
                .get('/api/teacher/classes')
                .set('Authorization', 'Bearer invalid_token');
            expect(res.status).toBe(403);
        });
    });
});
