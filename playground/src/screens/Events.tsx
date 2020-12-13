import React from 'react'
import { ScrollView, Text } from 'react-native'
import {
  useCastSession,
  useCastState,
  useMediaStatus,
} from 'react-native-google-cast'

export default function Events() {
  const castState = useCastState()
  const castSession = useCastSession()
  const mediaStatus = useMediaStatus()

  return (
    <ScrollView>
      <Text>Cast State: {castState}</Text>
      <Text>Cast Session ID: {castSession?.id}</Text>
      <Text>Media Status: {JSON.stringify(mediaStatus)}</Text>
    </ScrollView>
  )
}
