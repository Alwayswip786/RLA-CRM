import 'dotenv/config';
import { createServer, type Server } from 'node:http';
import app from './app.js';
import connectDB, { disconnectDB } from './config/db.js';
import { PORT } from './config/env.js';
import { seedInitialAdmin } from './scripts/seedAdmin.js';
import { seedInitialNotices } from './scripts/seedNotices.js';
import { seedInitialDoubts } from './scripts/seedDoubts.js';
import { initializeChamberChatSocket } from './socket/chamberChat.socket.js';
import { initializeLiveClassSocket } from './socket/liveClass.socket.js';

const port = PORT;
let server: Server | undefined;
let isShuttingDown = false;

/**
 * Initializes database connection and starts HTTP server listener.
 */
const startServer = async () => {
    try {
        await connectDB();
        await seedInitialAdmin();
        await seedInitialNotices();
        await seedInitialDoubts();

        server = createServer(app);
        const io = initializeChamberChatSocket(server);
        initializeLiveClassSocket(io);

        server.listen(port, () => {
            console.log(`RLA CRM Server: Running on port ${port} with Live Chamber & Classroom WebSockets`);
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

/**
 * Gracefully shuts down the server and cleans up database connections.
 */
const shutDown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`Received ${signal}, shutting down gracefully.`);

    // Force terminate if graceful shutdown hangs beyond 10 seconds
    const forceExit = setTimeout(() => {
        console.error('Graceful shutdown timed out.');
        process.exit(1);
    }, 10_000);
    forceExit.unref();

    if (server) {
        await new Promise<void>((resolve) => server?.close(() => resolve()));
    }

    await disconnectDB();
    clearTimeout(forceExit);
    process.exit(0);
};

process.on('SIGTERM', () => void shutDown('SIGTERM'));
process.on('SIGINT', () => void shutDown('SIGINT'));

process.on('uncaughtException', (error) => {
    console.error('UNCAUGHT EXCEPTION! Shutting down...');
    console.error(error.name, error.message);
    process.exit(1);
});

process.on('unhandledRejection', (reason) => {
    console.error('UNHANDLED REJECTION! Shutting down...', reason);
    void shutDown('unhandledRejection');
});

void startServer();
