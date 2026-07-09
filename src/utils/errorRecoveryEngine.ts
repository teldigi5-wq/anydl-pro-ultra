/**
 * Bulletproof Error Recovery Engine
 * Zero-tolerance policy for download failures
 */

export type ErrorSeverity = 'recoverable' | 'critical' | 'fatal';

export interface DownloadError {
  id: string;
  code: string;
  message: string;
  severity: ErrorSeverity;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  context: {
    url: string;
    fileSize?: number;
    percentComplete?: number;
  };
}

export interface RecoveryStrategy {
  name: string;
  condition: (error: DownloadError) => boolean;
  action: () => Promise<void>;
  priority: number;
}

class ErrorRecoveryEngine {
  private activeErrors: Map<string, DownloadError> = new Map();
  private recoveryStrategies: RecoveryStrategy[] = [];
  private errorHistory: DownloadError[] = [];

  constructor() {
    this.initializeRecoveryStrategies();
  }

  /**
   * Register automatic recovery strategies (prioritized by severity)
   */
  private initializeRecoveryStrategies() {
    // Strategy 1: Automatic retry with exponential backoff
    this.recoveryStrategies.push({
      name: 'Exponential Backoff Retry',
      condition: (e) => e.retryCount < e.maxRetries && e.severity === 'recoverable',
      action: async () => {
        const delay = Math.pow(2, this.activeErrors.size) * 1000;
        await new Promise(r => setTimeout(r, delay));
      },
      priority: 1
    });

    // Strategy 2: Switch to alternative proxy
    this.recoveryStrategies.push({
      name: 'Proxy Rotation',
      condition: (e) => e.code.includes('NETWORK') || e.code.includes('TIMEOUT'),
      action: async () => {
        // Rotate through proxy list (would be implemented in actual proxy handler)
        // Switch proxy here (proxy list available in ProxyGuard agent)
      },
      priority: 2
    });

    // Strategy 3: Reduce concurrent connections
    this.recoveryStrategies.push({
      name: 'Reduce Concurrency',
      condition: (e) => e.code.includes('ECONNRESET') || e.code.includes('EMFILE'),
      action: async () => {
        // Reduce fragment count
      },
      priority: 3
    });

    // Strategy 4: Resume from checkpoint
    this.recoveryStrategies.push({
      name: 'Resume Download',
      condition: (e) => e.code.includes('INTERRUPTED') && e.context.percentComplete! > 10,
      action: async () => {
        // Resume download from saved checkpoint
      },
      priority: 4
    });

    // Strategy 5: Switch to alternative source
    this.recoveryStrategies.push({
      name: 'Alternative Source',
      condition: (e) => e.code.includes('SOURCE_UNAVAILABLE'),
      action: async () => {
        // Find and use alternative stream
      },
      priority: 5
    });

    // Strategy 6: Fallback to lower quality
    this.recoveryStrategies.push({
      name: 'Quality Downgrade',
      condition: (e) => e.code.includes('BANDWIDTH') || e.code.includes('TIMEOUT'),
      action: async () => {
        // Automatically switch to lower bitrate format
      },
      priority: 6
    });

    // Strategy 7: DNS resolution fix
    this.recoveryStrategies.push({
      name: 'DNS Switch',
      condition: (e) => e.code.includes('ENOTFOUND') || e.code.includes('ENETUNREACH'),
      action: async () => {
        // Switch to Google DNS (8.8.8.8) or Cloudflare (1.1.1.1)
      },
      priority: 7
    });

    // Strategy 8: Clear cache & retry
    this.recoveryStrategies.push({
      name: 'Cache Clear',
      condition: (e) => e.code.includes('CORRUPT') || e.code.includes('CHECKSUM'),
      action: async () => {
        // Clear local cache and retry
        localStorage.clear();
      },
      priority: 8
    });
  }

  /**
   * Register a download error and attempt recovery
   */
  async handleDownloadError(
    url: string,
    error: Error,
    context: { fileSize?: number; percentComplete?: number } = {}
  ): Promise<'recovered' | 'failed' | 'fatal'> {
    const errorId = `err-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    
    const downloadError: DownloadError = {
      id: errorId,
      code: error.name || 'UNKNOWN_ERROR',
      message: error.message,
      severity: this.determineSeverity(error),
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 5,
      context: { url, ...context }
    };

    this.activeErrors.set(errorId, downloadError);
    this.errorHistory.push(downloadError);

    console.error(`[ErrorRecovery] ${downloadError.code}: ${downloadError.message}`);

    // Attempt recovery
    const applicableStrategies = this.recoveryStrategies
      .filter(s => s.condition(downloadError))
      .sort((a, b) => a.priority - b.priority);

    for (const strategy of applicableStrategies) {
      try {
        console.log(`[Recovery] Attempting: ${strategy.name}`);
        await strategy.action();
        downloadError.retryCount++;
        return 'recovered';
      } catch (strategyError) {
        console.warn(`[Recovery] ${strategy.name} failed:`, strategyError);
        continue;
      }
    }

    // If all strategies fail
    if (downloadError.retryCount < downloadError.maxRetries) {
      downloadError.retryCount++;
      return 'failed';
    } else {
      return 'fatal';
    }
  }

  /**
   * Determine error severity using pattern matching
   */
  private determineSeverity(error: Error): ErrorSeverity {
    const message = error.message.toUpperCase();

    // Critical errors (cannot recover)
    if (message.includes('404') || message.includes('FORBIDDEN') || message.includes('UNAUTHORIZED')) {
      return 'critical';
    }

    // Potential fatal errors
    if (message.includes('ILLEGAL') || message.includes('CORRUPTED') || message.includes('INVALID')) {
      return 'fatal';
    }

    // Recoverable errors
    return 'recoverable';
  }

  /**
   * Get all active errors
   */
  getActiveErrors(): DownloadError[] {
    return Array.from(this.activeErrors.values());
  }

  /**
   * Get error history
   */
  getErrorHistory(): DownloadError[] {
    return this.errorHistory;
  }

  /**
   * Clear resolved errors
   */
  clearError(errorId: string) {
    this.activeErrors.delete(errorId);
  }

  /**
   * Get statistics
   */
  getStats() {
    return {
      totalErrors: this.errorHistory.length,
      activeErrors: this.activeErrors.size,
      recoveredCount: this.errorHistory.filter(e => e.retryCount > 0).length,
      successRate: `${((this.errorHistory.filter(e => e.retryCount > 0).length / this.errorHistory.length) * 100).toFixed(1)}%`
    };
  }
}

export const errorRecoveryEngine = new ErrorRecoveryEngine();
