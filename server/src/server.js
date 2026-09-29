import {checkEnv} from './config/env.js';
const errs = checkEnv();
if (errs.length) { console.error('Startup blocked:\n - ' + errs.join('\n - ')); process.exit(1); }
const {default: app} = await import('./app.js'); const {pool} = await import('./config/db.js');
await pool.query('SELECT 1'); console.log('Database connected');
app.listen(process.env.PORT || 4000, () => console.log('API on :' + (process.env.PORT || 4000)));
