import crypto from 'node:crypto';
import { type NextFunction, type Request, type Response } from 'express';

const safeIncomingRequestId = (value: unknown) => {
    const candidate = String(value || '').trim();
    return /^[A-Za-z0-9._-]{8,96}$/.test(candidate) ? candidate : null;
};

/**
 * Assigns or propagates a unique Request ID for telemetry and sets response header.
 */
export const requestContext = (req: Request, res: Response, next: NextFunction) => {
    req.requestId = safeIncomingRequestId(req.headers['x-request-id']) || crypto.randomUUID();
    res.setHeader('X-Request-Id', req.requestId);
    next();
};

/**
 * Structured JSON production request logger.
 */
export const productionRequestLogger = (req: Request, res: Response, next: NextFunction) => {
    const startedAt = process.hrtime.bigint();
    res.once('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const log = {
            level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
            type: 'http_request',
            requestId: req.requestId,
            method: req.method,
            path: req.originalUrl.split('?')[0],
            statusCode: res.statusCode,
            durationMs: Number(durationMs.toFixed(2)),
            ip: req.ip,
        };
        console.log(JSON.stringify(log));
    });
    next();
};

export default requestContext;
