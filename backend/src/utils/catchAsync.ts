import { type Request, type Response, type NextFunction } from 'express';

/**
 * Wraps asynchronous Express route handlers to automatically catch any errors
 * and forward them to the global Express error handler via `next(err)`.
 */
export const catchAsync = (fn: Function) => {
    return (req: Request, res: Response, next: NextFunction) => {
        Promise.resolve(fn(req, res, next)).catch((err) => next(err));
    };
};

export default catchAsync;
