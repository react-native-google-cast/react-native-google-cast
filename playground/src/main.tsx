import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import React from 'react'
import { CastButton } from 'react-native-google-cast'
import Formats from './screens/Formats'
import Home from './screens/Home'

const Stack = createStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerRight: () => (
            <CastButton
              style={{
                tintColor: 'black',
                width: 24,
                height: 24,
                marginRight: 10,
              }}
            />
          ),
        }}
      >
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="Formats" component={Formats} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}
