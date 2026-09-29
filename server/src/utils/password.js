export const passwordProblem = p =>
  typeof p !== 'string' || p.length < 10 ? 'Use at least 10 characters.'
  : p.length > 72 ? 'Use 72 characters or fewer.'
  : !/[A-Za-z]/.test(p) || !/\d/.test(p) ? 'Include at least one letter and one number.' : null;
