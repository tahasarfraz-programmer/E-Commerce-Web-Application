export function checkEnv(env = process.env) {
  const errs = [];
  for (const k of ['DATABASE_HOST', 'DATABASE_USER', 'DATABASE_NAME', 'CLIENT_URL']) if (!env[k]) errs.push(`${k} is missing`);
  const s = env.JWT_SECRET || '';
  if (s.length < 32 || /replace_with|change_me/i.test(s)) errs.push('JWT_SECRET must be a random string of 32+ characters (not the placeholder)');
  if (env.NODE_ENV === 'production' && !env.DATABASE_PASSWORD) errs.push('DATABASE_PASSWORD is required in production');
  if (env.NODE_ENV === 'production' && !env.SMTP_URL) errs.push('SMTP_URL is required in production (password reset and verification emails)');
  return errs;
}
