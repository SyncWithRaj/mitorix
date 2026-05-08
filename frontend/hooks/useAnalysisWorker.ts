/**
 * Custom Hook for Web Worker Analysis
 *
 * Provides a hook to run analysis in a Web Worker for large repositories.
 */

import { useState, useCallback } from "react";
import { getWorkerManager } from "../lib/worker.utils";
import { shouldUseWebWorker } from "../lib/performance.utils";
import toast from "react-hot-toast";

interface UseAnalysisWorkerOptions {
  onProgress?: (progress: number, message: string) => void;
  onComplete?: (data: any) => void;
  onError?: (error: Error) => void;
}

export function useAnalysisWorker(options: UseAnalysisWorkerOptions = {}) {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");

  const runAnalysis = useCallback(
    async (data: { files: any[]; functions: any[]; relationships: any[] }) => {
      // Check if we should use Web Worker
      if (!shouldUseWebWorker(data.files.length)) {
        console.log("[Worker] File count below threshold, skipping Web Worker");
        return null;
      }

      const workerManager = getWorkerManager();

      if (!workerManager.isWebWorkerSupported()) {
        console.warn("[Worker] Web Workers not supported, falling back to main thread");
        toast.error("Web Workers not supported in this browser");
        return null;
      }

      setIsRunning(true);
      setProgress(0);
      setMessage("Initializing analysis...");

      try {
        const result = await workerManager.runAnalysis(data, (prog, msg) => {
          setProgress(prog);
          setMessage(msg);
          options.onProgress?.(prog, msg);
        });

        setIsRunning(false);
        setProgress(100);
        setMessage("Analysis complete");
        options.onComplete?.(result);

        return result;
      } catch (error: any) {
        setIsRunning(false);
        setProgress(0);
        setMessage("");
        console.error("[Worker] Analysis failed:", error);
        options.onError?.(error);
        toast.error(`Analysis failed: ${error.message}`);
        return null;
      }
    },
    [options]
  );

  return {
    runAnalysis,
    isRunning,
    progress,
    message,
  };
}
