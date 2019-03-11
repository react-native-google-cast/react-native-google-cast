import { Navigation } from 'react-native-navigation'

import Home from './screens/Home'
import Video from './screens/Video'

import { CastButton } from 'react-native-google-cast'

function registerComponents() {
  Navigation.registerComponent('castvideos.Home', () => Home)
  Navigation.registerComponent('castvideos.Video', () => Video)

  Navigation.registerComponent('castvideos.CastButton', () => CastButton)
}

module.exports = {
  registerComponents,
}
