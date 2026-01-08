"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pg_1 = require("pg");
const dotenv_1 = __importDefault(require("dotenv"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
dotenv_1.default.config();
const pool = new pg_1.Pool({
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
        const isMatch = await bcryptjs_1.default.compare(passwordToTest, user.password);
        console.log(`Testing password '${passwordToTest}': ${isMatch ? 'MATCH' : 'NO MATCH'}`);
        if (isMatch) {
            console.log('Login logic is correct. The issue might be in the API request or server state.');
        }
        else {
            console.log('Hash mismatch! The stored hash does not match the expected password.');
            // Let's try to hash it again to see what it should look like
            const newHash = bcryptjs_1.default.hashSync(passwordToTest, 10);
            console.log('Expected Hash format example:', newHash);
        }
    }
    catch (err) {
        console.error('Error:', err);
    }
    finally {
        pool.end();
    }
};
testLogin();
