/**
 * Chamber Mentorship WebSocket Rate Limiter & Flood Circuit Breaker
 * Adapted from GOmed MedMe socketLimiter pattern.
 */

export interface MessageRateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
  message?: string;
  forceDisconnect?: boolean;
}

export interface ReadRateLimitResult {
  allowed: boolean;
  retryAfterMs?: number;
}

const BURST_WINDOW_MS = 3_000;
const BURST_MAX = 5;

const SUSTAINED_WINDOW_MS = 60_000;
const SUSTAINED_MAX = 60;

const FLOOD_WINDOW_MS = 10_000;
const FLOOD_MAX_VIOLATIONS = 15;

const TYPING_THROTTLE_MS = 2_000;

const READ_WINDOW_MS = 5_000;
const READ_MAX = 15;

export class ChatSocketRateLimiter {
  private readonly messageTimestamps = new Map<string, number[]>();
  private readonly violationTimestamps = new Map<string, number[]>();
  private readonly typingTimestamps = new Map<string, number>();
  private readonly readTimestamps = new Map<string, number[]>();
  private readonly cleanupTimer: NodeJS.Timeout;

  constructor() {
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60_000);
    this.cleanupTimer.unref();
  }

  /**
   * Evaluates burst limit (5/3s), sustained limit (60/60s), and flood threshold (>15/10s).
   */
  consumeMessage(userId: string, now = Date.now()): MessageRateLimitResult {
    const timestamps = (this.messageTimestamps.get(userId) || []).filter(
      (t) => now - t < SUSTAINED_WINDOW_MS
    );

    const burstTimestamps = timestamps.filter((t) => now - t < BURST_WINDOW_MS);
    const isBurstExceeded = burstTimestamps.length >= BURST_MAX;
    const isSustainedExceeded = timestamps.length >= SUSTAINED_MAX;

    if (isBurstExceeded || isSustainedExceeded) {
      this.messageTimestamps.set(userId, timestamps);

      const violations = (this.violationTimestamps.get(userId) || []).filter(
        (t) => now - t < FLOOD_WINDOW_MS
      );
      violations.push(now);
      this.violationTimestamps.set(userId, violations);

      let retryAfterMs = 1_000;
      if (isBurstExceeded && burstTimestamps.length > 0) {
        const oldestBurst = burstTimestamps[0];
        if (oldestBurst !== undefined) {
          retryAfterMs = Math.max(100, oldestBurst + BURST_WINDOW_MS - now);
        }
      } else if (isSustainedExceeded && timestamps.length > 0) {
        const oldestSustained = timestamps[0];
        if (oldestSustained !== undefined) {
          retryAfterMs = Math.max(100, oldestSustained + SUSTAINED_WINDOW_MS - now);
        }
      }

      if (violations.length >= FLOOD_MAX_VIOLATIONS) {
        return {
          allowed: false,
          retryAfterMs: 30_000,
          message: 'Connection terminated due to excessive message flood.',
          forceDisconnect: true,
        };
      }

      return {
        allowed: false,
        retryAfterMs,
        message: 'You are sending messages too quickly. Please wait a moment.',
        forceDisconnect: false,
      };
    }

    timestamps.push(now);
    this.messageTimestamps.set(userId, timestamps);
    return { allowed: true };
  }

  /**
   * Throttles typing signals to 1 event per 2 seconds per user per conversation.
   */
  consumeTyping(userId: string, conversationId: string, now = Date.now()): boolean {
    const key = `${userId}:${conversationId}`;
    const lastTimestamp = this.typingTimestamps.get(key) || 0;
    if (now - lastTimestamp < TYPING_THROTTLE_MS) {
      return false;
    }
    this.typingTimestamps.set(key, now);
    return true;
  }

  /**
   * Throttles read receipt updates.
   */
  consumeRead(userId: string, now = Date.now()): ReadRateLimitResult {
    const timestamps = (this.readTimestamps.get(userId) || []).filter(
      (t) => now - t < READ_WINDOW_MS
    );
    if (timestamps.length >= READ_MAX) {
      this.readTimestamps.set(userId, timestamps);
      return { allowed: false, retryAfterMs: 1_000 };
    }
    timestamps.push(now);
    this.readTimestamps.set(userId, timestamps);
    return { allowed: true };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [userId, times] of this.messageTimestamps.entries()) {
      const active = times.filter((t) => now - t < SUSTAINED_WINDOW_MS);
      if (active.length === 0) this.messageTimestamps.delete(userId);
      else this.messageTimestamps.set(userId, active);
    }
    for (const [userId, violations] of this.violationTimestamps.entries()) {
      const active = violations.filter((t) => now - t < FLOOD_WINDOW_MS);
      if (active.length === 0) this.violationTimestamps.delete(userId);
      else this.violationTimestamps.set(userId, active);
    }
    for (const [key, timestamp] of this.typingTimestamps.entries()) {
      if (now - timestamp > 10_000) this.typingTimestamps.delete(key);
    }
    for (const [userId, times] of this.readTimestamps.entries()) {
      const active = times.filter((t) => now - t < READ_WINDOW_MS);
      if (active.length === 0) this.readTimestamps.delete(userId);
      else this.readTimestamps.set(userId, active);
    }
  }
}

export const chatSocketRateLimiter = new ChatSocketRateLimiter();
