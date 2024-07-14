import React from 'react'
import { Button, ScrollView, Text } from 'react-native'
import { useMediaStatus, useRemoteMediaClient } from 'react-native-google-cast'

export default function Session() {
  const client = useRemoteMediaClient()
  const status = useMediaStatus()

  if (!client)
    return (
      <Text style={{ margin: 10 }}>
        Connect to a Cast device to establish a session
      </Text>
    )

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      <Button
        onPress={() =>
          client.loadMedia({
            mediaInfo: {
              contentUrl:
                'https://devstreaming-cdn.apple.com/videos/streaming/examples/bipbop_16x9/bipbop_16x9_variant.m3u8',
            },
          })
        }
        title="Load multi-track video"
      />

      <Text style={{ marginTop: 20 }}>Media Tracks:</Text>

      {status?.mediaInfo?.mediaTracks?.map((track) => {
        const active = status.activeTrackIds?.includes(track.id)

        return (
          <Button
            disabled={active}
            key={track.id}
            onPress={() => client.setActiveTrackIds([track.id])}
            title={`${
              track.type === 'video'
                ? '🎥'
                : track.type === 'audio'
                  ? '🔊'
                  : '💬'
            } ${track.id} ${track.name} ${
              track.language ? `(${track.language})` : ''
            }`}
          />
        )
      })}

      <Button
        disabled={!status?.activeTrackIds?.length}
        onPress={() => client.setActiveTrackIds()}
        title="Reset Default"
      />

      <Text style={{ marginBottom: 10, marginTop: 20 }}>
        Active track IDs: {status?.activeTrackIds}
      </Text>
    </ScrollView>
  )
}
