import rateLimit from 'express-rate-limit';
const mk = (windowMs, limit, error, extra = {}) => rateLimit({windowMs, limit, standardHeaders: true, legacyHeaders: false, message: {error}, ...extra});
export const globalLimit = mk(15 * 60e3, 600, 'Too many requests. Wait a moment and try again.');
export const loginLimit = mk(15 * 60e3, 10, 'Too many sign-in attempts. Try again in 15 minutes.', {skipSuccessfulRequests: true});
export const registerLimit = mk(60 * 60e3, 10, 'Too many sign-ups from this network. Try again later.');
export const orderLimit = mk(60 * 60e3, 30, 'Too many order requests. Try again later.');
export const adminLimit = mk(15 * 60e3, 300, 'Too many admin requests. Try again shortly.');
export const mailLimit = mk(60 * 60e3, 5, 'Too many email requests. Try again in an hour.');
