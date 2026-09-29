import {Router} from 'express'; import bcrypt from 'bcryptjs'; import {z} from 'zod';
import {pool} from '../config/db.js'; import {issue, clearCookie, readToken, auth, wrap} from '../middleware/auth.js';
import {passwordProblem} from '../utils/password.js'; import {audit} from '../utils/audit.js'; import {createToken, consumeToken} from '../utils/tokens.js'; import {sendMail} from '../utils/mail.js';
const r = Router();
const DUMMY = bcrypt.hashSync('not-a-real-password-1', 12); // keeps timing similar when the email doesn't exist
const reg = z.object({
  name: z.string().trim().min(2, 'Enter your name.').max(100),
  email: z.string().trim().toLowerCase().email('Enter a valid email address.').max(150),
  password: z.string().superRefine((p, c) => { const m = passwordProblem(p); if (m) c.addIssue({code: 'custom', message: m}); })
});
const link = (path, t) => `${process.env.CLIENT_URL}${path}?token=${t}`;
const sendVerify = async u => { try { const t = await createToken(u.id, 'verify', 1440); await sendMail(u.email, 'Confirm your Atelier email', `Confirm your email: ${link('/verify-email', t)}\nThis link works for 24 hours.`); } catch (e) { console.error('verify mail failed:', e.message); } };
const pub = u => ({id: u.id, name: u.name, email: u.email, role: u.role, verified: !!u.email_verified_at});
r.post('/register', wrap(async (req, res) => {
  const d = reg.safeParse(req.body); if (!d.success) return res.status(400).json({error: d.error.issues[0].message});
  const {name, email, password} = d.data;
  const [ex] = await pool.query('SELECT id FROM users WHERE email=?', [email]);
  if (ex.length) return res.status(409).json({error: 'That email is already registered. Try signing in.'});
  const [i] = await pool.query('INSERT INTO users(name,email,password_hash) VALUES(?,?,?)', [name, email, await bcrypt.hash(password, 12)]);
  const u = {id: i.insertId, name, email, role: 'customer', token_version: 0};
  issue(res, u); sendVerify(u); audit(req, u.id, 'user.register'); res.status(201).json({user: pub(u)});
}));
r.post('/login', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase(), password = String(req.body?.password || '');
  const [[u]] = await pool.query('SELECT *, (locked_until IS NOT NULL AND locked_until>NOW()) AS locked FROM users WHERE email=?', [email]);
  if (u?.locked) return res.status(429).json({error: 'Too many failed attempts. Try again in 15 minutes.'});
  const ok = await bcrypt.compare(password, u ? u.password_hash : DUMMY) && !!u;
  if (!ok) {
    if (u) {
      if (u.failed_attempts + 1 >= 5) { await pool.query('UPDATE users SET failed_attempts=0, locked_until=DATE_ADD(NOW(), INTERVAL 15 MINUTE) WHERE id=?', [u.id]); audit(req, u.id, 'login.locked'); }
      else await pool.query('UPDATE users SET failed_attempts=failed_attempts+1 WHERE id=?', [u.id]);
    }
    audit(req, u?.id, 'login.failed'); return res.status(401).json({error: 'Email or password is incorrect.'});
  }
  await pool.query('UPDATE users SET failed_attempts=0, locked_until=NULL WHERE id=?', [u.id]);
  issue(res, u); res.json({user: pub(u)});
}));
// Signing out bumps token_version, which ends this session on every device.
r.post('/logout', wrap(async (req, res) => {
  const t = readToken(req); if (t) await pool.query('UPDATE users SET token_version=token_version+1 WHERE id=?', [t.id]);
  clearCookie(res); res.json({ok: true});
}));
r.get('/profile', auth, wrap(async (req, res) => { const [[u]] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]); res.json({user: pub(u)}); }));
r.post('/verify-email', wrap(async (req, res) => {
  const id = await consumeToken(req.body?.token, 'verify');
  if (!id) return res.status(400).json({error: 'This link is invalid or has expired. Request a new one from Account → Profile.'});
  await pool.query('UPDATE users SET email_verified_at=NOW() WHERE id=?', [id]); audit(req, id, 'email.verified'); res.json({ok: true});
}));
r.post('/resend-verification', auth, wrap(async (req, res) => {
  const [[u]] = await pool.query('SELECT * FROM users WHERE id=?', [req.user.id]);
  if (!u.email_verified_at) await sendVerify(u); res.json({ok: true});
}));
// Always answers the same way, so it can't be used to discover which emails are registered.
r.post('/forgot-password', wrap(async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const [[u]] = await pool.query('SELECT id,email FROM users WHERE email=?', [email]);
  if (u) { try { const t = await createToken(u.id, 'reset', 60); await sendMail(u.email, 'Reset your Atelier password', `Choose a new password: ${link('/reset-password', t)}\nThis link works for 1 hour. If you didn't ask for it, ignore this email.`); audit(req, u.id, 'password.reset_requested'); } catch (e) { console.error('reset mail failed:', e.message); } }
  res.json({ok: true});
}));
r.post('/reset-password', wrap(async (req, res) => {
  const problem = passwordProblem(req.body?.password); if (problem) return res.status(400).json({error: problem});
  const id = await consumeToken(req.body?.token, 'reset');
  if (!id) return res.status(400).json({error: 'This link is invalid or has expired. Request a new one.'});
  await pool.query('UPDATE users SET password_hash=?, token_version=token_version+1, failed_attempts=0, locked_until=NULL WHERE id=?', [await bcrypt.hash(req.body.password, 12), id]);
  audit(req, id, 'password.reset'); res.json({ok: true}); // token_version bump signs out every existing session
}));
export default r;
