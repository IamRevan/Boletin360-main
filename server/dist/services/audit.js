"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logAction = void 0;
const db_1 = require("../db");
const logAction = async (userId, action, details) => {
    try {
        await (0, db_1.query)('INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)', [userId, action, details]);
    }
    catch (err) {
        console.error('Failed to log action:', err);
    }
};
exports.logAction = logAction;
