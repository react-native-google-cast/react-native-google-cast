import React from 'react'
import { Image, Text, View } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { MediaQueueItem, useRemoteMediaClient } from 'react-native-google-cast'
import { NavigationComponentProps } from 'react-native-navigation'

export interface QueueScreenProps extends NavigationComponentProps {}

export default function QueueScreen({}: QueueScreenProps) {
  const client = useRemoteMediaClient()
  const [queue, setQueue] = React.useState<MediaQueueItem[]>([])

  React.useEffect(() => {
    client
      ?.getMediaStatus()
      .then((status) => {
        if (status) setQueue(status.queueItems)
      })
      .catch(console.warn)
  }, [client])

  return (
    <DraggableFlatList
      data={queue}
      renderItem={({ item, drag, isActive }) => (
        <TouchableOpacity
          key={item.itemId}
          onLongPress={drag}
          style={[
            isActive && {
              borderWidth: 1,
              borderRadius: 2,
              borderColor: '#ddd',
              shadowColor: '#000',
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            },
          ]}
        >
          <View
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                padding: 10,
              },
            ]}
          >
            <Image
              source={{ uri: item.mediaInfo.metadata?.images?.[0].url }}
              style={{ width: 160, height: 90 }}
            />

            <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
              <Text>{item.mediaInfo.metadata?.title}</Text>

              {item.mediaInfo.metadata &&
                'studio' in item.mediaInfo.metadata && (
                  <Text style={{ color: 'gray' }}>
                    {item.mediaInfo.metadata.studio}
                  </Text>
                )}
            </View>

            <Text onPress={drag} style={{ fontSize: 24 }}>
              &equiv;
            </Text>
          </View>
        </TouchableOpacity>
      )}
      keyExtractor={(item) => `draggable-item-${item.itemId}`}
      onDragEnd={({ data }) => setQueue(data)}
      style={{
        flex: 1,
        width: '100%',
        alignSelf: 'stretch',
      }}
    />
  )
}

QueueScreen.options = {
  topBar: {
    title: {
      alignment: 'center',
      color: 'white',
      text: 'Queue',
    },
    rightButtons: [
      {
        id: 'cast',
        component: {
          name: 'castvideos.CastButton',
        },
      },
    ],
  },
}
