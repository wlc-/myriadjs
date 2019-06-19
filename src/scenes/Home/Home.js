import React, {Component} from 'react';
import { WebView, View, StatusBar, Text, AsyncStorage, Linking, Platform } from 'react-native';
import styles from './styles';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Button from '../../components/Button';
import Loading from '../../components/Loading';
import Toast from 'react-native-simple-toast';

class Home extends Component {
  constructor(props): void {
    StatusBar.setHidden(true);

    super();
    this.state = {
      isLoading: true,
      hash: ''
    };

    this.loadHash();
  }

  onMessage = function (message) {
    var data = JSON.parse(message.nativeEvent.data);

    switch(data.method) {
      case 'startQr': this.startQr(); break;
      case 'saveHash': this.saveHash(data.hash); break;
      case 'showToast': this.showToast(data.text); break;
    }
  }.bind(this)

  saveHash = async function(hash) {
    console.log("Saving hash: ", hash);
    try {
      await AsyncStorage.setItem('@JSWallet:hash', hash);
    } catch (error) {
      console.log(hash);
    }
  }

  startQr = function() {
    console.log("StartQr()");
    this.props.navigation.navigate('ScanQr', {'qrCodeResult': this.qrCodeResult});
  }

  showToast = function(text) {
    console.log("ShowToast()");
    Toast.show(text, Toast.SHORT);
  }

  goExternalUrl = function(uri) {
    this.props.navigation.navigate('ExternalUrl', {uri: uri});
  }

  qrCodeResult = function(qrResult) {
    var data = JSON.stringify({method: "setQr", qrResult: qrResult});
    this.webview.postMessage(data);
    Toast.show("Scanned: "+qrResult, Toast.SHORT);
  }.bind(this)

  loadHash = async function() {
    try {
      const hash = await AsyncStorage.getItem('@JSWallet:hash');
      if (hash !== null) {
        this.setState({
          isLoading: false,
          hash: hash
        });
      }
      else {
        this.setState({
          isLoading: false,
          hash: ''
        });
      }
    } catch (error) {
      this.showToast("Error while loading data");
    }
  }

  onNavigationStateChange = (event) => {
    if (event.navigationType === 'click') {
      this.webview.stopLoading();
      this.goExternalUrl(event.url);
    }
  }

  render = function () {
    if (this.state.isLoading) {
      return (<Loading />);
    }
    else {
      var jsWalletSrc = 'index.html';

      if( Platform.OS === 'android' ) {
        jsWalletSrc = 'file:///android_asset/jswallet.github.io/index.html';
      }

      return (
        <WebView
          style={styles.container}
          ref={(ref) => { this.webview = ref; }}
          source={{ uri: jsWalletSrc }}
          onMessage={this.onMessage}
          injectedJavaScript={this.state.hash ? "window.location.hash='"+this.state.hash+"'; init();" : "init();"}
          scrollEnabled={false}
          onNavigationStateChange={this.onNavigationStateChange}
          onShouldStartLoadWithRequest={this.onShouldStartLoadWithRequest}
        />
      );
    }
  }
};

Home.propTypes = {
  navigation: React.PropTypes.object,
};


export default Home;
