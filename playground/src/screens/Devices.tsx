import React from 'react'
import { Button, ScrollView } from 'react-native'
import GoogleCast, { useCastDevice, useDevices } from 'react-native-google-cast'

export default function Devices() {
  const device = useCastDevice()
  const devices = useDevices()
  const sessionManager = GoogleCast.getSessionManager()

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
