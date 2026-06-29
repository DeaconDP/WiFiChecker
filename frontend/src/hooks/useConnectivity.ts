import { useEffect, useState } from "react";
import {
  readConnectivity,
  subscribeConnectivity,
  type ConnectivitySnapshot,
} from "../utils/network";

export function useConnectivity(): ConnectivitySnapshot {
  const [snapshot, setSnapshot] = useState<ConnectivitySnapshot>(() => readConnectivity());

  useEffect(() => {
    const refresh = () => setSnapshot(readConnectivity());
    return subscribeConnectivity(refresh);
  }, []);

  return snapshot;
}
