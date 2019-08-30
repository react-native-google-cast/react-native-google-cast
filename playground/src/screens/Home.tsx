import React from 'react'
import { Button, SectionList, Text, View } from 'react-native'
import { NavigationScreenProps } from 'react-navigation'

export interface Props extends NavigationScreenProps {}

export default function Home(props: Props) {
  return (
    <View>
      <SectionList
        renderItem={({ item, index }) => (
          <View style={{ paddingVertical: 5, paddingHorizontal: 20 }}>
            <Button
              key={index}
              testID={item.title}
              onPress={() => props.navigation.navigate(item.title)}
              title={item.title}
            />
          </View>
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={{ fontWeight: 'bold' }}>{title}</Text>
        )}
        sections={[
          {
            title: 'Title1',
            data: [{ title: 'Demo' }, { title: 'Formats' }],
          },
        ]}
        keyExtractor={(item, index) => item + index}
      />
    </View>
  )
}

const styles = {
  root: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  h1: {
    fontSize: 24,
    textAlign: 'center',
    margin: 30,
  },
  footer: {
    fontSize: 10,
    color: '#888',
    marginTop: 10,
  },
}
