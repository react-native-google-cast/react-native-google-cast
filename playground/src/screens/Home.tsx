import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Button, SectionList, Text, View } from 'react-native'

export interface HomeProps {}

export default function Home() {
  const navigation = useNavigation()

  return (
    <SectionList
      contentContainerStyle={{ padding: 10 }}
      keyExtractor={(item, index) => item.title + index}
      renderItem={({ item, index }) => (
        <View style={{ paddingVertical: 5, paddingHorizontal: 20 }}>
          <Button
            key={index}
            testID={item.title}
            onPress={() => navigation.navigate(item.title)}
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
          ],
        },
      ]}
    />
  )
}
