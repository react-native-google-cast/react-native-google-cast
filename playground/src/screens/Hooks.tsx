import React from 'react'
import { ScrollView, Text } from 'react-native'
import {
  useCastSession,
  useCastState,
  useMediaStatus,
} from 'react-native-google-cast'

export default function Hooks() {
  const castState = useCastState()
  const castSession = useCastSession()
  const mediaStatus = useMediaStatus()

  return (
    <ScrollView>
      <Text>Cast State: {castState}</Text>
      <Text>Cast Session ID: {castSession?.id}</Text>

      {mediaStatus && (
        <>
          <Text>Current Item ID: {mediaStatus.currentItemId}</Text>
          <Text>Player State: {mediaStatus.playerState}</Text>
          <Text>Stream Position: {mediaStatus.streamPosition}</Text>
        </>
      )}
    </ScrollView>
  )
}
