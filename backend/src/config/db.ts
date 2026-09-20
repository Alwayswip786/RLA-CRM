import mongoose from 'mongoose';
import { MONGO_URI, NODE_ENV } from './env.js';

const RETRY_DELAYS_MS = [0, 2_000, 5_000];
let listenersRegistered = false;

/**
 * Registers lifecycle event listeners for Mongoose connection.
 */
const registerConnectionListeners = (): void => {
    if (listenersRegistered) return;
    listenersRegistered = true;

    mongoose.connection.on('connected', () => {
        console.log('MongoDB connection established.');
    });
    mongoose.connection.on('reconnected', () => {
        console.log('MongoDB connection restored after a topology change.');
    });
    mongoose.connection.on('error', (error) => {
        console.error(`MongoDB connection error: ${error.message}`);
    });
    mongoose.connection.on('disconnected', () => {
        console.warn('MongoDB disconnected. Mongoose will attempt to reconnect.');
    });
};

/**
 * Connects to MongoDB with connection pooling, retry delays, and graceful handling.
 */
export const connectDB = async (): Promise<void> => {
    registerConnectionListeners();
    let connection: typeof mongoose | null = null;

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length; attempt += 1) {
        const delay = RETRY_DELAYS_MS[attempt] ?? 0;
        if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));

        try {
            connection = await mongoose.connect(MONGO_URI, {
                autoIndex: NODE_ENV !== 'production',
                maxPoolSize: 50,
                minPoolSize: 10,
                maxConnecting: 5,
                serverSelectionTimeoutMS: 5_000,
                socketTimeoutMS: 45_000,
                heartbeatFrequencyMS: 10_000,
                retryReads: true,
                retryWrites: true,
            });

            console.log(`MongoDB Connected: ${connection.connection.host} (Pool Size: 50)`);
            break;
        } catch (error: any) {
            const isLastAttempt = attempt === RETRY_DELAYS_MS.length - 1;
            console.error(`MongoDB connection attempt ${attempt + 1} failed: ${error.message}`);

            if (isLastAttempt) {
                if (NODE_ENV === 'production') {
                    throw error;
                } else {
                    console.warn(
                        'MongoDB connection could not be established in development. Starting server in degraded mode (readiness check will report 503).'
                    );
                }
            }
        }
    }
};

/**
 * Disconnects from MongoDB gracefully.
 */
export const disconnectDB = async (): Promise<void> => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
        console.log('MongoDB connection closed gracefully.');
    }
};

export default connectDB;
