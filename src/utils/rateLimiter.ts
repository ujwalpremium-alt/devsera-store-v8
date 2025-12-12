// Simple client-side rate limiter for API calls

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Check if an action is rate limited
 * @param key - Unique identifier for the action (e.g., 'login', 'order-submit')
 * @param maxAttempts - Maximum attempts allowed in the time window
 * @param windowMs - Time window in milliseconds
 * @returns Object with isLimited flag and remaining attempts
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000 // 1 minute default
): { isLimited: boolean; remainingAttempts: number; resetIn: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
  }

  const currentEntry = rateLimitStore.get(key);

  if (!currentEntry) {
    // First attempt
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      isLimited: false,
      remainingAttempts: maxAttempts - 1,
      resetIn: windowMs,
    };
  }

  if (currentEntry.count >= maxAttempts) {
    return {
      isLimited: true,
      remainingAttempts: 0,
      resetIn: currentEntry.resetTime - now,
    };
  }

  // Increment count
  currentEntry.count++;
  rateLimitStore.set(key, currentEntry);

  return {
    isLimited: false,
    remainingAttempts: maxAttempts - currentEntry.count,
    resetIn: currentEntry.resetTime - now,
  };
}

/**
 * Reset rate limit for a specific key
 */
export function resetRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Get formatted time remaining
 */
export function formatTimeRemaining(ms: number): string {
  const seconds = Math.ceil(ms / 1000);
  if (seconds < 60) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes > 1 ? 's' : ''}`;
}

/**
 * Rate limit decorator for async functions
 */
export function withRateLimit<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  key: string,
  maxAttempts: number = 5,
  windowMs: number = 60000
): (...args: Parameters<T>) => Promise<ReturnType<T>> {
  return async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    const { isLimited, resetIn } = checkRateLimit(key, maxAttempts, windowMs);
    
    if (isLimited) {
      throw new Error(`Too many attempts. Please try again in ${formatTimeRemaining(resetIn)}.`);
    }
    
    return fn(...args);
  };
}
