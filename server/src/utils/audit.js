import {pool} from '../config/db.js';
export const audit = (req, userId, action, detail = '') =>
  pool.query('INSERT INTO audit_log(user_id,action,detail,ip) VALUES(?,?,?,?)', [userId || null, action, String(detail).slice(0, 255), req.ip])
    .catch(e => console.error('audit failed:', e.message));
