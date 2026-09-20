/**
 * Custom Error class designed for API responses.
 * Extends the built-in JavaScript Error object to include HTTP status codes.
 */
class ApiError extends Error {
    public statusCode: number;
    public isOperational: boolean;
    public nextResetTime?: string;
    public code: string | undefined;
    public retryable: boolean | undefined;

    /**
     * @param statusCode - HTTP Status Code (e.g., 400 for Bad Request, 404 for Not Found)
     * @param message - The human-readable error message to send to the client
     * @param isOperational - True if it's an expected error (like bad input). False if it's a programming bug.
     * @param stack - The stack trace (optional, auto-generated if not provided)
     * @param code - Optional error code identifier
     * @param retryable - Optional flag indicating whether the client may safely retry
     */
    constructor(statusCode: number, message: string, isOperational = true, stack = '', code?: string, retryable?: boolean) {
        super(message);

        this.statusCode = statusCode;
        this.isOperational = isOperational;
        this.code = code;
        this.retryable = retryable;

        // Restore prototype chain for TypeScript class extension
        Object.setPrototypeOf(this, new.target.prototype);

        if (stack) {
            this.stack = stack;
        } else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

export default ApiError;
