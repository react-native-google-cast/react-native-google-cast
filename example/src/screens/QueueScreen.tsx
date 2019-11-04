import { ActionSheetProps } from '@expo/react-native-action-sheet'
import React from 'react'
import { Image, StyleSheet, Text, View } from 'react-native'
import DraggableFlatList from 'react-native-draggable-flatlist'
import { TouchableOpacity } from 'react-native-gesture-handler'
import { Navigation, Options } from 'react-native-navigation'
import { MediaQueueItem, RemoteMediaClient } from '../../../lib'

export interface Props extends ActionSheetProps {
  componentId: string
}

interface State {
  queue: MediaQueueItem[]
}

export default class QueueScreen extends React.Component<Props, State> {
  static options(passProps): Options {
    return {
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
  }

  state: State = {
    queue: [],
  }

  componentDidMount() {
    Navigation.events().bindComponent(this)
  }

  componentDidAppear() {
    RemoteMediaClient.getCurrent()
      .getMediaStatus()
      .then(status => {
        if (!status) return console.log('No mediaStatus')
        console.log(status)
        this.setState({ queue: status.queueItems })
      })
      .catch(console.warn)
  }

  render() {
    return (
      <DraggableFlatList
        data={this.state.queue}
        // @ts-ignore
        renderItem={({ item, index, move, moveEnd, isActive }) => (
          <TouchableOpacity
            key={item.itemId}
            // @ts-ignore
            onLongPress={move}
            onPressOut={moveEnd}
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
                source={{ uri: item.mediaInfo.metadata.images[0].url }}
                style={{ width: 160, height: 90 }}
              />

              <View style={{ flex: 1, marginLeft: 10, alignSelf: 'center' }}>
                <Text>{item.mediaInfo.metadata.title}</Text>
                <Text style={{ color: 'gray' }}>
                  {item.mediaInfo.metadata.studio}
                </Text>
              </View>

              <Text onPress={move} style={{ fontSize: 24 }}>
                &equiv;
              </Text>
            </View>
          </TouchableOpacity>
        )}
        keyExtractor={item => `draggable-item-${item.itemId}`}
        onMoveEnd={({ data }) => this.setState({ queue: data })}
        style={{
          flex: 1,
          width: '100%',
          alignSelf: 'stretch',
        }}
      />
    )
  }
}

const styles = StyleSheet.create({})
