import {
  ActionSheetProps,
  ActionSheetProvider,
  connectActionSheet,
} from '@expo/react-native-action-sheet'
import React from 'react'
import { Image, TouchableOpacity } from 'react-native'
import { gestureHandlerRootHOC } from 'react-native-gesture-handler'
import { Navigation } from 'react-native-navigation'
import { CastButton } from '../lib'
import HomeScreen from './src/screens/HomeScreen'
import QueueScreen from './src/screens/QueueScreen'
import VideoScreen from './src/screens/VideoScreen'

function wrap<T extends ActionSheetProps>(screen: React.ComponentType<T>) {
  const Component = (props: T) => (
    <ActionSheetProvider>
      {React.createElement(connectActionSheet(screen), props)}
    </ActionSheetProvider>
  )
  // @ts-ignore
  Component.options = screen.options
  return gestureHandlerRootHOC(Component)
}

Navigation.registerComponent('castvideos.Home', () => wrap(HomeScreen))
Navigation.registerComponent('castvideos.Queue', () => wrap(QueueScreen))
Navigation.registerComponent('castvideos.Video', () => wrap(VideoScreen))

Navigation.registerComponent('castvideos.CastButton', () => () => (
  <CastButton style={{ tintColor: 'white', width: 44, height: 44 }} />
))

Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      stack: {
        children: [
          {
            component: {
              name: 'castvideos.Home',
            },
          },
        ],
        options: {
          statusBar: {
            style: 'light',
          },
          topBar: {
            backButton: {
              color: 'white',
              showTitle: false,
              title: '',
            },
            background: {
              color: '#03A9F4',
            },
            title: {
              color: 'white',
            },
            visible: true,
          },
        },
      },
    },
  })
})
