const { Navigation } = require('react-native-navigation')
const { Platform } = require('react-native')
const { registerComponents } = require('./src')

registerComponents()

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
          buttonColor: 'white',
          title: {
            alignment: 'center',
            color: 'white',
            text: 'CastVideos',
          },
          topBar: {
            background: {
              color: '#03A9F4',
            },
          },
        },
      },
    },
  })
})
