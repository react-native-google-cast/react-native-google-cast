import React, { useEffect, useState } from 'react'
import { Button, ScrollView } from 'react-native'
import GoogleCast, {
  Device,
  useCastSession,
  useDevices,
} from 'react-native-google-cast'

export default function Devices() {
  const [device, setDevice] = useState<Device>()
  const devices = useDevices()
  const session = useCastSession()
  const sessionManager = GoogleCast.getSessionManager()

  useEffect(() => {
    if (!session) setDevice(undefined)
    else session.getCastDevice().then(setDevice)
  }, [session])

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      {devices.map((d) => {
        const active = device?.deviceId === d.deviceId

        return (
          <Button
            color={active ? 'green' : undefined}
            key={d.deviceId}
            onPress={() =>
              active
                ? sessionManager.endCurrentSession()
                : sessionManager.startSession(d.deviceId)
            }
            title={d.friendlyName}
          />
        )
      })}
    </ScrollView>
  )
}
