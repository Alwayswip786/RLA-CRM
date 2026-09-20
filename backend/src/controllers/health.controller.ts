import { type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { NODE_ENV } from '../config/env.js';

/**
 * Service identification banner route handler for GET /
 */
export const rootServiceInfo = (_req: Request, res: Response) => {
    res.status(200).json({
        status: 'success',
        message: 'Rajinder Law Academy CRM API is operational.',
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
};

/**
 * Deep liveness & readiness check verifying MongoDB connectivity and ping.
 */
export const readinessHealth = async (_req: Request, res: Response): Promise<void> => {
    const mongoConnected = mongoose.connection.readyState === 1;

    if (mongoConnected) {
        try {
            await mongoose.connection.db?.admin().ping();
        } catch {
            res.status(503).json({
                status: 'not_ready',
                mongo: 'unavailable',
                uptimeSeconds: Math.round(process.uptime()),
                environment: NODE_ENV,
                timestamp: new Date().toISOString(),
            });
            return;
        }
    }

    res.status(mongoConnected ? 200 : 503).json({
        status: mongoConnected ? 'ready' : 'not_ready',
        mongo: mongoConnected ? 'connected' : 'disconnected',
        uptimeSeconds: Math.round(process.uptime()),
        environment: NODE_ENV,
        timestamp: new Date().toISOString(),
    });
};
