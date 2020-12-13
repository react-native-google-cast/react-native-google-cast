import { useNavigation } from '@react-navigation/native'
import React from 'react'
import { Button, SectionList, Text, View } from 'react-native'

export interface HomeProps {}

export default function Home() {
  const navigation = useNavigation()

  return (
    <View>
      <SectionList
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
            title: 'Formats',
            data: [{ title: 'Formats' }],
          },
          {
            title: 'Queue',
            data: [{ title: 'Queue' }],
          },
          {
            title: 'Events',
            data: [{ title: 'Events' }],
          },
        ]}
        keyExtractor={(item, index) => item.title + index}
      />
    </View>
  )
}
