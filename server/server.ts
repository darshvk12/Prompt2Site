import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from 'cors';
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth';
import userRouter from './routes/UserRoutes.js';
import prisma from './lib/prisma';
import projectRouter from './routes/projectRoutes';
import { stripeWebhook } from './controllers/stripeWebhook.js';

const app = express();

const port = 3000;

const corsOptions = {
    origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
    credentials: true,
}

app.use(cors(corsOptions))
app.post('/api/stripe', express.raw({type: 'application/json'}), stripeWebhook)

app.use('/api/auth', toNodeHandler(auth));

app.use(express.json({limit: '50mb'}))

app.use('/api/user', userRouter);

app.get('/', (req: Request, res: Response) => {
    res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project',projectRouter)

app.use('/api/user', userRouter);

app.listen(port, ()=>{
    console.log(`Server is running at http://localhost:${port}`);

});