import { type NextFunction, type Request, type Response } from 'express';
import { isTransientMongoError } from '../utils/mongoError.js';

/**
 * Middleware that intercepts outgoing JSON responses with status 500+
 * to sanitize internal details in production and convert transient database errors into clean 503s.
 */
export const safeErrorResponseMiddleware = (_req: Request, res: Response, next: NextFunction) => {
    const sendJson = res.json.bind(res);

    res.json = ((body: any) => {
        if (res.statusCode >= 500 && body && typeof body === 'object') {
            const internalMessage = String(body.error || body.message || '');

            if (isTransientMongoError(new Error(internalMessage))) {
                res.status(503);
                res.setHeader('Retry-After', '2');
                return sendJson({
                    success: false,
                    message: 'Database is temporarily unavailable. Please retry shortly.',
                    code: 'DATABASE_TEMPORARILY_UNAVAILABLE',
                    retryable: true,
                });
            }

            if (process.env.NODE_ENV === 'production' && 'error' in body) {
                const { error: _internalError, ...safeBody } = body;
                return sendJson(safeBody);
            }
        }

        return sendJson(body);
    }) as Response['json'];

    next();
};

export default safeErrorResponseMiddleware;
