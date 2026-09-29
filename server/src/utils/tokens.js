import {randomBytes, createHash} from 'node:crypto'; import {pool} from '../config/db.js';
const h = t => createHash('sha256').update(t).digest('hex'); // only the hash is stored
export async function createToken(userId, type, ttlMin) {
  await pool.query('UPDATE user_tokens SET used_at=NOW() WHERE user_id=? AND type=? AND used_at IS NULL', [userId, type]);
  const raw = randomBytes(32).toString('hex');
  await pool.query('INSERT INTO user_tokens(user_id,type,token_hash,expires_at) VALUES(?,?,?,DATE_ADD(NOW(), INTERVAL ? MINUTE))', [userId, type, h(raw), ttlMin]);
  return raw;
}
export async function consumeToken(raw, type) {
  const [[row]] = await pool.query('SELECT id,user_id FROM user_tokens WHERE token_hash=? AND type=? AND used_at IS NULL AND expires_at>NOW()', [h(String(raw || '')), type]);
  if (!row) return null;
  const [r] = await pool.query('UPDATE user_tokens SET used_at=NOW() WHERE id=? AND used_at IS NULL', [row.id]);
  return r.affectedRows ? row.user_id : null;
}
