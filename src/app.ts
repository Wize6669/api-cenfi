import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import {config} from './config';
import helmet from 'helmet';

// Global Middlewares
import {authorizationVerifierMiddleware} from './middlewares/authorizationVerifier.middleware';
import {jwtVerifierMiddleware} from './middlewares/jwtVerifier.middleware';

// Routes
import { router as homeHealthRouter } from './routes/homeHealth.route';
import { router as authRouter } from './routes/auth.route';
import { router as adminRouter } from './routes/admin.route';
import { router as userRouter } from './routes/user.route';
import { router as categoryRouter } from './routes/category.route';
import { router as simulatorRouter } from './routes/simulator.route';
import { router as questionRouter } from './routes/question.route';
import { router as imageRouter } from './routes/image.route';
import { router as courseRouter } from './routes/course.route';
import { router as authSimulatorRouter } from './routes/authSimulator.route';
import { router as resultRouter } from './routes/result.route';

const app = express();
const HOST_FRONT_END = config.get('HOST_FRONT_END');

app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: HOST_FRONT_END,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  })
);

// Routes
app.use('/', homeHealthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', authorizationVerifierMiddleware, adminRouter);
app.use('/api/v1/users', jwtVerifierMiddleware, userRouter);
app.use('/api/v1/categories', categoryRouter);
app.use('/api/v1/simulators', simulatorRouter);
app.use('/api/v1/questions', questionRouter);
app.use('/api/v1/images', imageRouter);
app.use('/api/v1/courses', courseRouter);
app.use('/api/v1/auth-simulators', authSimulatorRouter);
app.use('/api/v1/results', resultRouter);

export {app};
