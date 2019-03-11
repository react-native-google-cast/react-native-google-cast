import React from 'react'
import { AppRegistry } from 'react-native'
import Main from './src/index'

class Playground extends React.Component {
  render() {
    return <Main />
  }
}

AppRegistry.registerComponent('RNGCPlayground', () => Playground)
