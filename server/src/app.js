import express from 'express'; import helmet from 'helmet'; import cors from 'cors'; import morgan from 'morgan'; import cookieParser from 'cookie-parser';
import auth from './routes/auth.js'; import products from './routes/products.js'; import orders from './routes/orders.js'; import admin from './routes/admin.js';
import content from './routes/content.js'; import reviews from './routes/reviews.js'; import addresses from './routes/addresses.js'; import wishlist from './routes/wishlist.js';
import {globalLimit, loginLimit, registerLimit, orderLimit, adminLimit, mailLimit} from './middleware/rateLimits.js';
const app = express();
app.set('trust proxy', process.env.TRUST_PROXY === '1' ? 1 : 0); // set TRUST_PROXY=1 behind nginx/a load balancer so rate limits see real IPs
app.use(helmet(), cors({origin: process.env.CLIENT_URL, credentials: true}), express.json({limit: '100kb'}), cookieParser(), morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use('/api', globalLimit);
// CSRF defence: cookies alone can't authorise a write; the request must carry a custom header that cross-site forms can't set.
app.use('/api', (req, res, next) => ['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.get('x-requested-with') === 'atelier' ? next() : res.status(403).json({error: 'Request blocked.'}));
app.use('/api/auth/login', loginLimit); app.use('/api/auth/register', registerLimit);
app.use('/api/auth/forgot-password', mailLimit); app.use('/api/auth/resend-verification', mailLimit);
app.use('/api/auth', auth); app.use('/api/products', products); app.use('/api/orders', orderLimit, orders); app.use('/api/admin', adminLimit, admin);
app.use('/api/content', content); app.use('/api/reviews', reviews); app.use('/api/addresses', addresses); app.use('/api/wishlist', wishlist);
app.use('/api', (_q, res) => res.status(404).json({error: 'Not found.'}));
app.use((e, _q, res, _n) => {
  const client = e.status && e.status < 500;
  if (!client) console.error(e);
  res.status(client ? e.status : 500).json({error: client ? 'Invalid request.' : 'Something went wrong on our side. Try again.'});
});
export default app;
