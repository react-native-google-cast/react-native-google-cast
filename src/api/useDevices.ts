import { useEffect, useState } from 'react'
import Device from '../types/Device'
import CastContext from './CastContext'

/**
 * Hook that listens to changes to available devices and returns current list.
 */
export default function useDevices(): Device[] {
  const discoveryManager = CastContext.getDiscoveryManager()

  const [devices, setDevices] = useState<Device[]>([])

  useEffect(() => {
    discoveryManager.getDevices().then(setDevices)

    const listener = discoveryManager.onDevicesUpdated(setDevices)

    return () => {
      listener.remove()
    }
  }, [discoveryManager])

  return devices
}
