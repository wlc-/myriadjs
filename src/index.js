import React, { Component } from 'react';
import Loading from './components/Loading';
import { HomeStack } from './config/routes';

export default class MyriadJS extends Component {
  static navigationOptions = {
    header: {
      visible: false,
    }
  }
  
  render() {
    return (
      <HomeStack />
    );
  }
}