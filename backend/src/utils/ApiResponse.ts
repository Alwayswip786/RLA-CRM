/**
 * Standardized API response format helper.
 */
export class ApiResponse<T = any> {
    public success: boolean;
    public statusCode: number;
    public message: string;
    public data?: T;
    public timestamp: string;

    constructor(statusCode: number, data?: T, message = 'Success') {
        this.success = statusCode < 400;
        this.statusCode = statusCode;
        this.message = message;
        if (data !== undefined) {
            this.data = data;
        }
        this.timestamp = new Date().toISOString();
    }
}

export default ApiResponse;
