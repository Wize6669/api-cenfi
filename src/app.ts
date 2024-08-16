import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { config } from './config';
import helmet from 'helmet';

// Middlewares
import { authorizationVerifierMiddleware } from './middlewares/authorizationVerifier.middleware';
import { schemaVerifierMiddleware } from './middlewares/schemaVerifier.middleware';
import { headerAuthorizationSchemaJWT } from './schemasJoi/headerAuthorization.schema';


// Routes
import { router as homeHealthRouter } from './routes/homeHealth.route';
import { router as authRouter } from "./routes/auth.route";
import { router as adminRouter } from "./routes/admin.route";

const app = express();
const HOST_FRONT_END = config.get('HOST_FRONT_END');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(helmet());
app.use(morgan('dev'));
app.use(
  cors({
    origin: HOST_FRONT_END,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  })
);

// Routes
app.use('/', homeHealthRouter);
app.use('/api/v1/auth', authRouter);
app.use('/api/v1/admin', authorizationVerifierMiddleware, adminRouter);

export { app };
