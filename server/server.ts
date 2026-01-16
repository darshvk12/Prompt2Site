import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';

const app = express();

const port = 3000;

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
}

app.use(cors(corsOptions))

import prisma from './lib/prisma';

let dbHealthy = false;
let dbError: unknown = null;

function validateDatabaseUrl() {
    const raw = process.env.DATABASE_URL;
    if (!raw) {
        console.warn('[ENV] DATABASE_URL is not set in server/.env');
        return;
    }

    if (raw.startsWith('"') || raw.endsWith('"')) {
        console.warn('[ENV] DATABASE_URL appears to be wrapped in quotes. Remove surrounding quotes to avoid parsing issues.');
        console.warn(`[ENV] Current value (masked): ${raw.slice(0, 20)}...`);
    }

    try {
        const url = new URL(raw);
        console.log(`[ENV] DB host: ${url.host}, DB name: ${url.pathname.replace('/', '')}`);
        if (!raw.includes('sslmode')) console.warn('[ENV] DATABASE_URL does not include sslmode - Neon requires SSL in most cases. Add `?sslmode=require` to the URL if missing.');
    } catch (e) {
        // not a normal URL, skip
    }
}

// check DB connectivity at startup
async function checkDb() {
    try {
        await prisma.$queryRaw`SELECT 1`;
        dbHealthy = true;
        console.log('[DB] Connection OK')
    } catch (err: any) {
        dbHealthy = false;
        dbError = err;
        console.error('[DB] Connection failed:', err?.message || err);

        // Prisma P1001 - can't reach DB
        if (err?.code === 'P1001' || /Can't reach database server/.test(String(err?.message))) {
            console.error('[DB] Prisma P1001 detected: The database host is unreachable. Common causes:');
            console.error('  - Remote DB (e.g., Neon) is paused or stopped. Resume it from the provider dashboard.');
            console.error('  - Incorrect DATABASE_URL in server/.env (extra quotes, wrong host/port, changed credentials).');
            console.error('  - Network or firewall blocking outbound connections from your machine.');
            console.error('Quick checks:');
            console.error('  - Verify `DATABASE_URL` matches the connection string in your Neon dashboard.');
            console.error('  - Run `npx prisma db pull` from the `server` folder to get more detailed connection errors.');
            console.error('  - Try `psql "<YOUR_DATABASE_URL>" -c "SELECT 1;"` if you have psql installed.');
            console.error('Neon-specific: If your Neon DB is paused it will not accept connections. Open the Neon dashboard and click Resume on your database project.');
        }
    }
}

// expose a small ping route to confirm server is reachable
app.get('/api/auth/ping', (req: Request, res: Response) => {
    res.json({ ok: true, message: 'auth server reachable' })
})

// DB health endpoint (useful to diagnose P1001)
app.get('/api/db/ping', async (req: Request, res: Response) => {
    try {
        const result = await prisma.$queryRaw`SELECT 1`;
        res.json({ ok: true, result })
    } catch (err) {
        res.status(503).json({ ok: false, error: String(err) })
    }
})

// create auth handler reference so we can call it directly for testing
const authHandler = toNodeHandler(auth);

// a test route that forwards the request to the auth handler
app.get('/api/auth/test', (req, res, next) => {
    if (!dbHealthy) return res.status(503).json({ ok: false, error: 'Database unreachable. Check server logs or run /api/db/ping for details.' })
    return authHandler(req, res, next);
});

// mount the auth handler at /api/auth but guard it with DB health check
app.use('/api/auth', (req, res, next) => {
    if (!dbHealthy) return res.status(503).json({ ok: false, error: 'Database unreachable. Check server logs or run /api/db/ping for details.' })
    next();
}, authHandler);

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

// start server after checking DB connectivity
(async () => {
    await checkDb();

    app.listen(port, () => {
        console.log(`Server is running at http://localhost:${port}`);
        if (!dbHealthy) {
            console.warn('[DB] Database is not reachable. Auth routes will return 503 until the DB is available.');
        }
    });
})();