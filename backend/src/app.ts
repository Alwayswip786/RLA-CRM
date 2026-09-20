import express, { type Express, type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// --- Config & Utilities ---
import { CORS_ORIGIN, NODE_ENV } from './config/env.js';
import ApiError from './utils/ApiError.js';

// --- Middleware Pipeline ---
import { requestContext, productionRequestLogger } from './middlewares/requestContext.middleware.js';
import { safeErrorResponseMiddleware } from './middlewares/safeErrorResponse.middleware.js';
import { globalErrorHandler } from './middlewares/errorHandler.middleware.js';

// --- Route Handlers ---
import healthRoutes from './routes/health.routes.js';
import authRoutes from './routes/auth.routes.js';
import noticeRoutes from './routes/notice.routes.js';
import doubtRoutes from './routes/doubt.routes.js';
import chatRoutes from './routes/chat.routes.js';
import pyqRoutes from './routes/pyq.routes.js';
import judgementRoutes from './routes/judgement.routes.js';
import mediaRoutes from './routes/media.routes.js';
import passport from './config/passport.js';

const app: Express = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');

// 1. Cross-Origin Resource Sharing
app.use(
    cors({
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Request-Id',
            'X-Session-ID',
            'X-Platform',
            'X-App-Version',
            'X-Idempotency-Key',
            'Idempotency-Key',
        ],
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

// 2. HTTP Security Headers
app.use(helmet());

// 3. Response Compression
app.use(compression());

// 4. Data Sanitization against NoSQL Query Injection
app.use(mongoSanitize());

// 5. Cookie Parsing
app.use(cookieParser());

// 6. Request Context & Unique Request ID
app.use(requestContext);

// 7. Safe Error Response Sanitization
app.use(safeErrorResponseMiddleware);

// 8. Request Logging
if (NODE_ENV === 'production') {
    app.use(productionRequestLogger);
} else {
    app.use(morgan('dev'));
}

// 9. Rate Limiting for API Endpoints
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: NODE_ENV === 'production' ? 2400 : 100_000,
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many requests from this IP, please try again later.',
    skip: (req) =>
        NODE_ENV !== 'production' &&
        (req.ip === '127.0.0.1' || req.ip === '::1' || req.ip === '::ffff:127.0.0.1'),
});
app.use('/api/', limiter);

// 10. Body Parsers
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// 11. Passport Authentication
app.use(passport.initialize());

// 12. Core Health & Status Routes
app.use(healthRoutes);

// 12. Authentication & Student Profile Routes
app.use('/api/auth', authRoutes);

// 13. Official Academy Notice Board & Broadcast Routes
app.use('/api/notices', noticeRoutes);

// 14. Academic Doubts & Mentorship Query Routes
app.use('/api/doubts', doubtRoutes);

// 15. Real-Time Chamber Mentorship Chat Routes
app.use('/api/chat', chatRoutes);

// 16. Solved Previous Year Questions (PYQ) Archive Routes
app.use('/api/pyqs', pyqRoutes);

// 17. Landmark Judgement Digest Repository Routes
app.use('/api/judgements', judgementRoutes);

// 18. Media Asset Management & Cloudinary CDN Routes
app.use('/api/media', mediaRoutes);

// 19. 404 Catch-all Handler
app.all('*', (req: Request, _res: Response, next: NextFunction) => {
    next(new ApiError(404, `Can't find ${req.originalUrl} on this server!`));
});

// 13. Centralized Global Error Handler
app.use(globalErrorHandler);

export default app;
