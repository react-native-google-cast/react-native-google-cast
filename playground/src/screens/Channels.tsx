import React, { useState } from 'react'
import { Button, ScrollView, Text } from 'react-native'
import { useCastChannel } from 'react-native-google-cast'

export default function Channels() {
  const [lastMessage, setLastMessage] = useState<{}>()

  const castChannel = useCastChannel(
    'urn:x-cast:com.reactnative.googlecast.playground',
    setLastMessage
  )

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      {castChannel ? (
        <>
          <Button
            onPress={() =>
              castChannel?.sendMessage(
                JSON.stringify({ message: 'Hello, world!' })
              )
            }
            title="Send Message"
          />

          <Text>{JSON.stringify(lastMessage)}</Text>
        </>
      ) : (
        <Text>Connect to a Cast device to establish a channel</Text>
      )}
    </ScrollView>
  )
}
