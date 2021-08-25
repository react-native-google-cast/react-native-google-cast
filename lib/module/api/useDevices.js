import { useEffect, useState } from 'react';
import CastContext from './CastContext';
/**
 * Hook that listens to changes to available devices and returns current list.
 */

export default function useDevices() {
  const discoveryManager = CastContext.getDiscoveryManager();
  const [devices, setDevices] = useState([]);
  useEffect(() => {
    discoveryManager.getDevices().then(setDevices);
    const listener = discoveryManager.onDevicesUpdated(setDevices);
    return () => {
      listener.remove();
    };
  }, [discoveryManager]);
  return devices;
}
//# sourceMappingURL=useDevices.js.map