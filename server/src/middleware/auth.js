import jwt from 'jsonwebtoken'; import {pool} from '../config/db.js';
const COOKIE = 'atelier_token';
const opts = () => ({httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/'});
export const issue = (res, u) => res.cookie(COOKIE,
  jwt.sign({id: u.id, tv: u.token_version}, process.env.JWT_SECRET, {expiresIn: '1d', algorithm: 'HS256'}), {...opts(), maxAge: 864e5});
export const clearCookie = res => res.clearCookie(COOKIE, opts());
export const readToken = req => { try { return jwt.verify(req.cookies?.[COOKIE] || '', process.env.JWT_SECRET, {algorithms: ['HS256']}); } catch { return null; } };
// Re-checks the user in the DB on every request: demotions, deletions and sign-outs take effect immediately.
export const auth = async (req, res, next) => {
  try {
    const t = readToken(req); if (!t) return res.status(401).json({error: 'Please sign in to continue.'});
    const [[u]] = await pool.query('SELECT id,role,token_version FROM users WHERE id=?', [t.id]);
    if (!u || u.token_version !== t.tv) { clearCookie(res); return res.status(401).json({error: 'Your session has ended. Please sign in again.'}); }
    req.user = {id: u.id, role: u.role}; next();
  } catch (e) { next(e); }
};
export const admin = (req, res, next) => req.user?.role === 'admin' ? next() : res.status(403).json({error: 'Admin access required.'});
export const wrap = fn => (req, res, next) => fn(req, res).catch(next);
