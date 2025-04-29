import 'react-native-gesture-handler'

import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React, { useCallback } from 'react'
import { CastButton } from 'react-native-google-cast'
import Client from './screens/Client'
import Devices from './screens/Devices'
import Formats from './screens/Formats'
import Home from './screens/Home'
import Queue from './screens/Queue'
import Session from './screens/Session'
import Tracks from './screens/Tracks'
import MiniController from './screens/MiniController'

const Stack = createStackNavigator()

export default function App() {
  const headerRight = useCallback(
    () => (
      <CastButton
        style={{
          tintColor: 'black',
          width: 24,
          height: 24,
          marginRight: 10,
        }}
      />
    ),
    []
  )

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={{
          headerRight,
        }}
      >
        <Stack.Screen name="Client" component={Client} />
        <Stack.Screen name="Devices" component={Devices} />
        <Stack.Screen name="Formats" component={Formats} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Queue" component={Queue} />
        <Stack.Screen name="Session" component={Session} />
        <Stack.Screen name="Tracks" component={Tracks} />
        <Stack.Screen name="MiniController" component={MiniController} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
