import React, { useState } from 'react'
import { Button, ScrollView, Text } from 'react-native'
import CastContext, { useCastChannel } from 'react-native-google-cast'

export default function Session() {
  const [lastMessage, setLastMessage] = useState<{}>()

  const castChannel = useCastChannel(
    'urn:x-cast:com.reactnative.googlecast.playground',
    setLastMessage
  )

  if (!castChannel)
    return (
      <Text style={{ margin: 10 }}>
        Connect to a Cast device to establish a session
      </Text>
    )

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      <Button
        onPress={() => CastContext.getSessionManager().endCurrentSession()}
        title="End Session"
      />

      <Text style={{ marginBottom: 10, marginTop: 20 }}>Custom Channel</Text>

      <Button
        onPress={() =>
          castChannel?.sendMessage(JSON.stringify({ message: 'Hello, world!' }))
        }
        title="Send Message"
      />

      {lastMessage && (
        <Text>Last received message: {JSON.stringify(lastMessage)}</Text>
      )}
    </ScrollView>
  )
}
