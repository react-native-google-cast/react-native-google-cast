/* @flow */

import React from 'react';
import { AppRegistry } from 'react-native';
import Main from './app/main';

class Index extends React.Component {
  render() {
    return <Main />;
  }
}

AppRegistry.registerComponent('example', () => Index);
