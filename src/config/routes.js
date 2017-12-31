/* eslint-disable react/prop-types */
import React from 'react';
import { Image } from 'react-native';
import { StackNavigator, TabNavigator } from 'react-navigation';

import Home from '../scenes/Home';
import ScanQr from '../scenes/ScanQr';
import ExternalUrl from '../scenes/ExternalUrl';

export const HomeStack = StackNavigator({
  Home: {
    screen: Home,
    navigationOptions: {
      header: null,
    },
  },
  ScanQr: {
    screen: ScanQr,
    navigationOptions: {
      header: null,
    },
  },
  ExternalUrl: {
    screen: ExternalUrl,
    navigationOptions: {
      header: null,
    },
  },
});

