import axios from 'axios';

const API_URL = 'http://localhost:3001/api';
let adminToken = '';
let teacherToken = '';
let createdUserId = 0;

const runTests = async () => {
    try {
        console.log('--- 1. Login as Admin ---');
        const adminLogin = await axios.post(`${API_URL}/login`, { email: 'admin@boletin360.com', password: 'password' });
        adminToken = adminLogin.data.token;
        console.log('Admin Login Success');

        console.log('\n--- 2. Create User (Admin) - Audit Log Check ---');
        const newUser = await axios.post(`${API_URL}/users`, {
            nombres: 'Test',
            apellidos: 'Teacher',
            email: 'testteacher@boletin360.com',
            password: 'password123',
            role: 'Docente',
            teacherId: null
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        createdUserId = newUser.data.id;
        console.log('User Created:', newUser.data.email);

        console.log('\n--- 3. Login as New Teacher ---');
        const teacherLogin = await axios.post(`${API_URL}/login`, { email: 'testteacher@boletin360.com', password: 'password123' });
        teacherToken = teacherLogin.data.token;
        console.log('Teacher Login Success');

        console.log('\n--- 4. RBAC Check: Teacher tries to create User (Should Fail) ---');
        try {
            await axios.post(`${API_URL}/users`, {
                nombres: 'Hacker',
                apellidos: 'User',
                email: 'hacker@boletin360.com',
                password: 'password123',
                role: 'Admin'
            }, { headers: { Authorization: `Bearer ${teacherToken}` } });
            console.error('RBAC FAILED: Teacher was able to create user!');
        } catch (err: any) {
            if (err.response && err.response.status === 403) {
                console.log('RBAC Success: Teacher denied (403)');
            } else {
                console.error('RBAC Error:', err.message);
            }
        }

        console.log('\n--- 5. Zod Validation Check: Invalid Email ---');
        try {
            await axios.post(`${API_URL}/users`, {
                nombres: 'Bad',
                apellidos: 'Email',
                email: 'not-an-email',
                password: 'password123',
                role: 'Docente'
            }, { headers: { Authorization: `Bearer ${adminToken}` } });
            console.error('Validation FAILED: Invalid email accepted!');
        } catch (err: any) {
            if (err.response && err.response.status === 400) {
                console.log('Validation Success: Invalid email rejected (400)');
                console.log('Error details:', JSON.stringify(err.response.data));
            } else {
                console.error('Validation Error:', err.message);
            }
        }

        console.log('\n--- 6. Admin Password Reset ---');
        await axios.post(`${API_URL}/users/${createdUserId}/reset-password`, {
            newPassword: 'newpassword123'
        }, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('Password Reset Success');

        console.log('\n--- 7. Verify New Password Login ---');
        await axios.post(`${API_URL}/login`, { email: 'testteacher@boletin360.com', password: 'newpassword123' });
        console.log('Login with new password Success');

        console.log('\n--- 8. Cleanup (Delete User) ---');
        await axios.delete(`${API_URL}/users/${createdUserId}`, { headers: { Authorization: `Bearer ${adminToken}` } });
        console.log('Cleanup Success');

    } catch (err: any) {
        console.error('Test Failed:', err.message);
        if (err.response) {
            console.error('Response Data:', err.response.data);
        }
    }
};

runTests();
