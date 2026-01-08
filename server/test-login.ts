import { Pool } from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const testLogin = async () => {
    try {
        console.log('Testing login for admin@boletin360.com...');
        const res = await pool.query('SELECT * FROM users WHERE email = $1', ['admin@boletin360.com']);

        if (res.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = res.rows[0];
        console.log('User found:', user.email);
        console.log('Stored Hash:', user.password);

        const passwordToTest = 'password';
        const isMatch = await bcrypt.compare(passwordToTest, user.password);

        console.log(`Testing password '${passwordToTest}': ${isMatch ? 'MATCH' : 'NO MATCH'}`);

        if (isMatch) {
            console.log('Login logic is correct. The issue might be in the API request or server state.');
        } else {
            console.log('Hash mismatch! The stored hash does not match the expected password.');
            // Let's try to hash it again to see what it should look like
            const newHash = bcrypt.hashSync(passwordToTest, 10);
            console.log('Expected Hash format example:', newHash);
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        pool.end();
    }
};

testLogin();
