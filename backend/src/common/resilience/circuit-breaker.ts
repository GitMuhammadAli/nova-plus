import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import logger from '../logger/winston.logger';

export interface CircuitBreakerOptions {
  failureThreshold: number; // Number of failures before opening
  resetTimeout: number; // Time in ms before attempting to close
  monitoringPeriod: number; // Time window for failure counting
  halfOpenMaxCalls: number; // Max calls in half-open state
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, reject requests
  HALF_OPEN = 'HALF_OPEN', // Testing if service recovered
}

interface FailureRecord {
  timestamp: number;
  error: string;
}

@Injectable()
export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failures: FailureRecord[] = [];
  private lastFailureTime: number = 0;
  private halfOpenCalls: number = 0;
  private successCount: number = 0;

  private options: CircuitBreakerOptions;

  constructor(
    private readonly name: string,
    options?: CircuitBreakerOptions,
  ) {
    // Use provided options or defaults from config
    this.options = options || {
      failureThreshold: 5,
      resetTimeout: 60000,
      monitoringPeriod: 60000,
      halfOpenMaxCalls: 3,
    };
  }

  /**
   * Create circuit breaker with config from environment
   */
  static createFromConfig(
    name: string,
    configService: ConfigService,
    overrides?: Partial<CircuitBreakerOptions>,
  ): CircuitBreaker {
    const options: CircuitBreakerOptions = {
      failureThreshold:
        overrides?.failureThreshold ??
        configService.get<number>('circuitBreaker.failureThreshold', 5),
      resetTimeout:
        overrides?.resetTimeout ??
        configService.get<number>('circuitBreaker.resetTimeoutMs', 60000),
      monitoringPeriod:
        overrides?.monitoringPeriod ??
        configService.get<number>('circuitBreaker.monitoringPeriodMs', 60000),
      halfOpenMaxCalls:
        overrides?.halfOpenMaxCalls ??
        configService.get<number>('circuitBreaker.halfOpenMaxCalls', 3),
    };

    return new CircuitBreaker(name, options);
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    // Check circuit state
    if (this.state === CircuitState.OPEN) {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure >= this.options.resetTimeout) {
        this.transitionToHalfOpen();
      } else {
        throw new Error(
          `Circuit breaker ${this.name} is OPEN. Service unavailable.`,
        );
      }
    }

    // Clean old failures outside monitoring period
    this.cleanOldFailures();

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure(error as Error);
      throw error;
    }
  }

  /**
   * Record a successful operation
   */
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.options.halfOpenMaxCalls) {
        this.transitionToClosed();
      }
    } else if (this.state === CircuitState.CLOSED) {
      // Reset failure count on success in closed state
      this.failures = [];
    }
  }

  /**
   * Record a failed operation
   */
  private onFailure(error: Error): void {
    this.lastFailureTime = Date.now();
    this.failures.push({
      timestamp: Date.now(),
      error: error.message,
    });

    if (this.state === CircuitState.HALF_OPEN) {
      // Any failure in half-open immediately opens the circuit
      this.transitionToOpen();
    } else if (this.state === CircuitState.CLOSED) {
      // Check if we've exceeded the failure threshold
      if (this.failures.length >= this.options.failureThreshold) {
        this.transitionToOpen();
      }
    }
  }

  /**
   * Transition to OPEN state
   */
  private transitionToOpen(): void {
    this.state = CircuitState.OPEN;
    this.halfOpenCalls = 0;
    this.successCount = 0;
    logger.warn(`Circuit breaker ${this.name} opened`, {
      circuitBreaker: this.name,
      state: 'OPEN',
      failures: this.failures.length,
    });
  }

  /**
   * Transition to HALF_OPEN state
   */
  private transitionToHalfOpen(): void {
    this.state = CircuitState.HALF_OPEN;
    this.halfOpenCalls = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker ${this.name} half-opened`, {
      circuitBreaker: this.name,
      state: 'HALF_OPEN',
    });
  }

  /**
   * Transition to CLOSED state
   */
  private transitionToClosed(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.halfOpenCalls = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker ${this.name} closed`, {
      circuitBreaker: this.name,
      state: 'CLOSED',
    });
  }

  /**
   * Remove failures outside the monitoring period
   */
  private cleanOldFailures(): void {
    const now = Date.now();
    this.failures = this.failures.filter(
      (failure) => now - failure.timestamp < this.options.monitoringPeriod,
    );
  }

  /**
   * Get current state
   */
  getState(): CircuitState {
    return this.state;
  }

  /**
   * Get failure count
   */
  getFailureCount(): number {
    return this.failures.length;
  }

  /**
   * Reset circuit breaker (for testing/manual intervention)
   */
  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failures = [];
    this.lastFailureTime = 0;
    this.halfOpenCalls = 0;
    this.successCount = 0;
    logger.info(`Circuit breaker ${this.name} manually reset`);
  }

  /**
   * Get health status
   */
  getHealthStatus(): {
    name: string;
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number | null;
  } {
    return {
      name: this.name,
      state: this.state,
      failureCount: this.failures.length,
      lastFailureTime: this.lastFailureTime || null,
    };
  }
}

/**
 * Circuit breaker manager - manages multiple circuit breakers
 */
@Injectable()
export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();

  constructor(private configService: ConfigService) {}

  /**
   * Get or create a circuit breaker
   */
  getBreaker(name: string, options?: CircuitBreakerOptions): CircuitBreaker {
    if (!this.breakers.has(name)) {
      if (options) {
        this.breakers.set(name, new CircuitBreaker(name, options));
      } else {
        this.breakers.set(
          name,
          CircuitBreaker.createFromConfig(name, this.configService),
        );
      }
    }
    return this.breakers.get(name)!;
  }

  /**
   * Get all circuit breaker statuses
   */
  getAllStatuses(): Array<{
    name: string;
    state: CircuitState;
    failureCount: number;
    lastFailureTime: number | null;
  }> {
    return Array.from(this.breakers.values()).map((breaker) =>
      breaker.getHealthStatus(),
    );
  }

  /**
   * Reset all circuit breakers
   */
  resetAll(): void {
    this.breakers.forEach((breaker) => breaker.reset());
  }
}
