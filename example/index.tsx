import React from 'react'
import { CastButton } from 'react-native-google-cast'
import { Navigation } from 'react-native-navigation'
import HomeScreen from './src/screens/HomeScreen'
import VideoScreen from './src/screens/VideoScreen'

Navigation.registerComponent('castvideos.Home', () => HomeScreen)
Navigation.registerComponent('castvideos.Video', () => VideoScreen)

Navigation.registerComponent('castvideos.CastButton', () => () => (
  <CastButton style={{ tintColor: 'white', width: 44, height: 44 }} />
))

Navigation.events().registerAppLaunchedListener(async () => {
  Navigation.setRoot({
    root: {
      stack: {
        id: 'main',
        children: [
          {
            component: {
              name: 'castvideos.Home',
            },
          },
        ],
        options: {
          topBar: {
            backButton: {
              color: 'white',
            },
            background: {
              color: '#03A9F4',
            },
          },
        },
      },
    },
  })
})
