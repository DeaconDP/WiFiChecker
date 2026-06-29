import { useCallback, useState } from "react";
import { runLatencySuite, type LatencyResult } from "../utils/network";

interface LatencyState {
  results: LatencyResult[];
  running: boolean;
  lastRunAt: Date | null;
}

export function useLatencyTest() {
  const [state, setState] = useState<LatencyState>({
    results: [],
    running: false,
    lastRunAt: null,
  });

  const runTest = useCallback(async () => {
    setState((current) => ({ ...current, running: true }));

    const results = await runLatencySuite();

    setState({
      results,
      running: false,
      lastRunAt: new Date(),
    });
  }, []);

  return { ...state, runTest };
}
