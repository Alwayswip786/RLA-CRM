import { type Request, type Response, type NextFunction } from 'express';
import ApiError from '../utils/ApiError.js';
import { isTransientMongoError } from '../utils/mongoError.js';
import { NODE_ENV } from '../config/env.js';

/**
 * Global error handling middleware adhering to GOmed API conventions.
 */
export const globalErrorHandler = (err: any, req: Request, res: Response, _next: NextFunction) => {
    let error = { ...err };
    error.message = err.message;

    // Log to console for development troubleshooting
    if (NODE_ENV === 'development') {
        console.error(err);
    }

    // 1. Catch Mongoose Bad ObjectId Errors (CastError)
    if (err.name === 'CastError') {
        const message = `Resource not found. Invalid: ${err.path}`;
        error = new ApiError(404, message);
    }

    // 2. Catch Mongoose Duplicate Key Errors (11000)
    if (err.code === 11000) {
        const message = 'Duplicate field value entered.';
        error = new ApiError(400, message);
    }

    // 3. Catch Mongoose Validation Errors
    if (err.name === 'ValidationError' && err.errors) {
        const message = Object.values(err.errors).map((val: any) => val.message).join(', ');
        error = new ApiError(400, message);
    }

    // 4. Catch Transient MongoDB Errors
    if (isTransientMongoError(err)) {
        error = new ApiError(503, 'Database is temporarily unavailable. Please retry shortly.');
        res.setHeader('Retry-After', '2');
    }

    const statusCode = error.statusCode || 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || 'Internal Server Error',
        requestId: req.requestId,
        ...(error.code
            ? { code: error.code, retryable: Boolean(error.retryable) }
            : statusCode === 503
                ? { code: 'DATABASE_TEMPORARILY_UNAVAILABLE', retryable: true }
                : {}),
        nextResetTime: err.nextResetTime || error.nextResetTime,
        ...(NODE_ENV === 'development' && { stack: err.stack }),
    });
};

export default globalErrorHandler;
