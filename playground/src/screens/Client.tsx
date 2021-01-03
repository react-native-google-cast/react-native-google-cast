import React, { useEffect } from 'react'
import { Button, ScrollView, Text, View } from 'react-native'
import {
  MediaPlayerState,
  useMediaStatus,
  useRemoteMediaClient,
  useStreamPosition,
} from 'react-native-google-cast'

export default function Client() {
  const client = useRemoteMediaClient()
  const status = useMediaStatus()
  const streamPosition = useStreamPosition()

  useEffect(() => {
    const started = client?.onMediaPlaybackStarted(() =>
      console.log('playback started')
    )
    const ended = client?.onMediaPlaybackEnded(() =>
      console.log('playback ended')
    )

    return () => {
      started?.remove()
      ended?.remove()
    }
  }, [client])

  if (!client)
    return (
      <Text style={{ margin: 10 }}>
        Connect to a Cast device to establish a session
      </Text>
    )

  return (
    <ScrollView contentContainerStyle={{ padding: 10 }}>
      {!status || status.playerState === MediaPlayerState.IDLE ? (
        <Button
          onPress={() =>
            client.loadMedia({
              mediaInfo: {
                contentUrl:
                  'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/mp4/BigBuckBunny.mp4',
              },
            })
          }
          title="Load Media"
        />
      ) : status.playerState === MediaPlayerState.PAUSED ? (
        <Button onPress={() => client.play()} title="Play" />
      ) : (
        <Button onPress={() => client.pause()} title="Pause" />
      )}

      {streamPosition != null && (
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          <Button
            onPress={() => client.seek({ position: -10, relative: true })}
            title="-10s"
          />

          <Text style={{ margin: 5 }}>Position: {streamPosition}</Text>

          <Button
            onPress={() => client.seek({ position: 10, relative: true })}
            title="+10s"
          />
        </View>
      )}

      {status && (
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          <Button
            disabled={status.playbackRate <= 0.5}
            onPress={() =>
              client.setPlaybackRate(round(status.playbackRate - 0.1))
            }
            title="-0.1"
          />

          <Text style={{ margin: 5 }}>
            Playback rate: {round(status.playbackRate)}
          </Text>

          <Button
            disabled={status.playbackRate >= 2.0}
            onPress={() =>
              client.setPlaybackRate(round(status.playbackRate + 0.1))
            }
            title="+0.1"
          />
        </View>
      )}

      {status && (
        <View
          style={{
            alignItems: 'center',
            flexDirection: 'row',
            justifyContent: 'center',
            marginTop: 10,
          }}
        >
          <Button
            disabled={status.volume <= 0.0}
            onPress={() => client.setStreamVolume(round(status.volume - 0.1))}
            title="-0.1"
          />

          <Text style={{ margin: 5 }}>Volume: {round(status.volume)}</Text>

          <Button
            disabled={status.volume >= 1.0}
            onPress={() => client.setStreamVolume(round(status.volume + 0.1))}
            title="+0.1"
          />

          <View style={{ marginLeft: 10 }}>
            <Button
              onPress={() => client.setStreamMuted(!status.isMuted)}
              title={status.isMuted ? 'Unmute' : 'Mute'}
            />
          </View>
        </View>
      )}

      {status && (
        <View style={{ marginTop: 10 }}>
          <Button onPress={() => client.stop()} title="Stop" />
        </View>
      )}
    </ScrollView>
  )
}

function round(number: number, decimals = 1) {
  const factor = Math.pow(10, decimals)
  return Math.round(number * factor) / factor
}
