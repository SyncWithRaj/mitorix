/**
 * Performance Utilities for CodeFlow
 *
 * Provides non-blocking UI helpers for long-running operations.
 * Ported from index.html performance patterns.
 */

/**
 * Yield to browser to prevent UI freezing during long operations.
 * Uses MessageChannel for immediate task scheduling (faster than setTimeout).
 *
 * Usage:
 * ```ts
 * for (let i = 0; i < largeArray.length; i++) {
 *   // Do work
 *   if (i % 50 === 0) {
 *     await yieldToBrowser();
 *   }
 * }
 * ```
 */
export function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    channel.port1.onmessage = () => {
      channel.port1.close();
      resolve();
    };
    channel.port2.postMessage(null);
    channel.port2.close();
  });
}

/**
 * Throttle function execution to improve performance.
 * Ensures function is called at most once per specified delay.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0;
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    const now = Date.now();
    const timeSinceLastCall = now - lastCall;

    if (timeSinceLastCall >= delay) {
      lastCall = now;
      func.apply(this, args);
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        lastCall = Date.now();
        func.apply(this, args);
      }, delay - timeSinceLastCall);
    }
  };
}

/**
 * Debounce function execution.
 * Delays execution until after specified time has elapsed since last call.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (this: any, ...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

/**
 * Check if we should use Web Worker for analysis based on repo size.
 */
export function shouldUseWebWorker(fileCount: number): boolean {
  // Use Web Worker for repos with >100 files
  return fileCount > 100;
}

/**
 * Check if graph is large enough to require performance optimizations.
 */
export function isLargeGraph(nodeCount: number): boolean {
  return nodeCount > 300;
}

/**
 * Batch process array with yielding to prevent UI blocking.
 *
 * @param items - Array to process
 * @param processor - Function to process each item
 * @param batchSize - Number of items to process before yielding (default: 50)
 */
export async function batchProcess<T>(
  items: T[],
  processor: (item: T, index: number) => void | Promise<void>,
  batchSize: number = 50
): Promise<void> {
  for (let i = 0; i < items.length; i++) {
    await processor(items[i], i);

    // Yield to browser every batchSize items
    if ((i + 1) % batchSize === 0) {
      await yieldToBrowser();
    }
  }
}

/**
 * Request idle callback with fallback for browsers that don't support it.
 */
export function requestIdleCallback(callback: () => void, options?: { timeout?: number }): number {
  if (typeof window !== "undefined" && "requestIdleCallback" in window) {
    return window.requestIdleCallback(callback, options);
  }

  // Fallback to setTimeout
  return setTimeout(callback, 1) as any;
}

/**
 * Cancel idle callback with fallback.
 */
export function cancelIdleCallback(id: number): void {
  if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
    window.cancelIdleCallback(id);
  } else {
    clearTimeout(id);
  }
}

/**
 * Measure performance of a function.
 */
export async function measurePerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const end = performance.now();
  console.log(`[Performance] ${name}: ${(end - start).toFixed(2)}ms`);
  return result;
}
