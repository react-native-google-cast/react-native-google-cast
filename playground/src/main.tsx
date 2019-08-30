import React from 'react'
import { createAppContainer, createStackNavigator } from 'react-navigation'
import { CastButton } from '../../lib'
import Formats from './screens/Formats'
import Home from './screens/Home'

const AppNavigator = createStackNavigator(
  {
    Home,
    Formats,
  },
  {
    defaultNavigationOptions: {
      headerRight: (
        <CastButton
          style={{ tintColor: 'black', width: 24, height: 24, marginRight: 10 }}
        />
      ),
    },
  }
)

export default createAppContainer(AppNavigator)
