import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import pool from './db/pool';
import router from './routes';

const app = express();
const PORT = Number(process.env.PORT ?? 4000);

// ── Security & middleware ─────────────────────────────────────────────────
app.use(helmet());
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173').split(' ');
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Rate limiting on auth routes
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20, message: { error: 'Too many login attempts' } }));
app.use('/api', rateLimit({ windowMs: 60 * 1000, max: 300 }));

// ── Routes ────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected' });
  } catch {
    res.status(503).json({ status: 'degraded', db: 'disconnected' });
  }
});

app.use('/api', router);

// ── 404 & error handler ───────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => console.log(`AgileFlow API running on :${PORT}`));
}

export default app;
