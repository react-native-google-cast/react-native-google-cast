import React from 'react'
import { gestureHandlerRootHOC } from 'react-native-gesture-handler'
import { CastButton } from 'react-native-google-cast'
import { Navigation } from 'react-native-navigation'
import HomeScreen from './screens/HomeScreen'
import QueueScreen from './screens/QueueScreen'
import VideoScreen from './screens/VideoScreen'

Navigation.registerComponent('castvideos.Home', () =>
  gestureHandlerRootHOC(HomeScreen)
)
Navigation.registerComponent('castvideos.Queue', () =>
  gestureHandlerRootHOC(QueueScreen)
)
Navigation.registerComponent('castvideos.Video', () =>
  gestureHandlerRootHOC(VideoScreen)
)

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
