const TRANSIENT_MONGO_ERROR_NAMES = new Set([
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoServerSelectionError',
    'MongoTopologyClosedError',
    'MongoNotConnectedError',
]);

const TRANSIENT_MONGO_MESSAGE_PATTERNS = [
    /primary marked stale/i,
    /electionId\/setVersion mismatch/i,
    /not primary/i,
    /node is recovering/i,
    /server selection timed out/i,
    /connection (?:closed|reset|refused)/i,
    /topology (?:closed|destroyed)/i,
];

export const isTransientMongoError = (error: unknown): boolean => {
    const candidate = error as {
        name?: string;
        message?: string;
        hasErrorLabel?: (label: string) => boolean;
    } | null;

    if (!candidate) return false;
    if (candidate.name && TRANSIENT_MONGO_ERROR_NAMES.has(candidate.name)) return true;
    if (candidate.hasErrorLabel?.('RetryableWriteError') || candidate.hasErrorLabel?.('TransientTransactionError')) {
        return true;
    }

    const message = String(candidate.message || '');
    return TRANSIENT_MONGO_MESSAGE_PATTERNS.some((pattern) => pattern.test(message));
};

export default isTransientMongoError;
