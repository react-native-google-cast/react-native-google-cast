import React from 'react'
import {
  Button,
  Platform,
  SectionList,
  Text,
  TouchableHighlight,
  View,
} from 'react-native'

import { Navigation } from 'react-native-navigation'

class WelcomeScreen extends React.Component {
  static options() {
    return {
      _statusBar: {
        backgroundColor: 'transparent',
        style: 'dark',
        drawBehind: true,
      },
      topBar: {
        title: {
          text: 'My Screen',
        },
        largeTitle: {
          visible: false,
        },
        drawBehind: true,
        visible: false,
        animate: false,
      },
    }
  }

  render() {
    return (
      <SectionList
        renderItem={({ item, index }) => (
          <Button
            key={index}
            testID={item.title}
            onPress={() => this.onPress(item)}
            title={item.title}
          />
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
    )
  }

  onPress = item => {
    Navigation.push(this.props.componentId, {
      component: {
        name: `googlecast.${item.title}`,
        options: {
          animations: {
            push: {
              enabled: false,
            },
          },
        },
      },
    })
  }
}

module.exports = WelcomeScreen

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
