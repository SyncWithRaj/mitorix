/**
 * Web Worker Utilities for CodeFlow
 * 
 * Provides helpers for offloading heavy computations to Web Workers.
 */

import type { AnalysisWorkerInput, AnalysisWorkerOutput } from '../workers/analysis.worker';

/**
 * Create and manage an analysis worker.
 */
export class AnalysisWorkerManager {
  private worker: Worker | null = null;
  private isSupported: boolean;

  constructor() {
    this.isSupported = typeof Worker !== 'undefined';
  }

  /**
   * Check if Web Workers are supported.
   */
  isWebWorkerSupported(): boolean {
    return this.isSupported;
  }

  /**
   * Initialize the worker.
   */
  async initialize(): Promise<void> {
    if (!this.isSupported) {
      console.warn('[Worker] Web Workers not supported in this environment');
      return;
    }

    try {
      // Create worker from the analysis worker file
      this.worker = new Worker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
    } catch (error) {
      console.error('[Worker] Failed to initialize worker:', error);
      this.isSupported = false;
    }
  }

  /**
   * Run analysis in worker thread.
   */
  async runAnalysis(
    data: {
      files: any[];
      functions: any[];
      relationships: any[];
    },
    onProgress?: (progress: number, message: string) => void
  ): Promise<any> {
    if (!this.worker) {
      await this.initialize();
    }
    if (!this.worker) {
      throw new Error('Worker not initialized');
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker not initialized'));
        return;
      }

      // Set up message handler
      this.worker.onmessage = (event: MessageEvent<AnalysisWorkerOutput>) => {
        const { type, data: resultData, progress, message, error } = event.data;

        switch (type) {
          case 'progress':
            if (onProgress && progress !== undefined && message) {
              onProgress(progress, message);
            }
            break;

          case 'complete':
            resolve(resultData);
            break;

          case 'error':
            reject(new Error(error || 'Worker analysis failed'));
            break;
        }
      };

      // Set up error handler
      this.worker.onerror = (error) => {
        reject(new Error(`Worker error: ${error.message}`));
      };

      // Send analysis request
      this.worker.postMessage({
        type: 'analyze',
        data,
      } as AnalysisWorkerInput);
    });
  }

  /**
   * Terminate the worker.
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}

/**
 * Singleton instance of the worker manager.
 */
let workerManager: AnalysisWorkerManager | null = null;

/**
 * Get or create the worker manager instance.
 */
export function getWorkerManager(): AnalysisWorkerManager {
  if (!workerManager) {
    workerManager = new AnalysisWorkerManager();
  }
  return workerManager;
}

/**
 * Clean up worker manager.
 */
export function cleanupWorkerManager(): void {
  if (workerManager) {
    workerManager.terminate();
    workerManager = null;
  }
}
