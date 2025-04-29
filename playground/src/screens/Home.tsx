import { useNavigation } from '@react-navigation/native'
import { StackNavigationProp } from '@react-navigation/stack'
import React, { useEffect } from 'react'
import { Button, SectionList, Text, View } from 'react-native'
import CastContext, { PlayServicesState } from 'react-native-google-cast'
import { RootStackParamList } from './types'

export interface HomeProps {}

export default function Home() {
  const navigation =
    useNavigation<StackNavigationProp<RootStackParamList, 'Home'>>()

  useEffect(() => {
    CastContext.getPlayServicesState().then((state) => {
      if (state && state !== PlayServicesState.SUCCESS)
        CastContext.showPlayServicesErrorDialog(state)
    })
  }, [])

  return (
    <SectionList
      contentContainerStyle={{ padding: 10 }}
      keyExtractor={(item, index) => item.title + index}
      renderItem={({ item, index }) => (
        <View style={{ paddingVertical: 5, paddingHorizontal: 20 }}>
          <Button
            key={index}
            testID={item.title}
            onPress={() =>
              navigation.navigate(item.title as keyof RootStackParamList)
            }
            title={item.title}
          />
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={{ fontWeight: 'bold' }}>{title}</Text>
      )}
      sections={[
        {
          title: 'Casting',
          data: [{ title: 'Formats' }, { title: 'Queue' }],
        },
        {
          title: 'API',
          data: [
            { title: 'Devices' },
            { title: 'Session' },
            { title: 'Client' },
            { title: 'Tracks' },
            { title: 'MiniController' },
          ],
        },
      ]}
    />
  )
}
