import React, {Component} from 'react';
import { Text, StatusBar, View } from 'react-native';
import styles from './styles';
import QRCodeScanner from 'react-native-qrcode-scanner';
import Button from '../../components/Button';
import Torch from 'react-native-torch';

class ScanQr extends Component  {
  constructor (props) {
    super(props);

    StatusBar.setHidden(true);

    this.state = {
      isTorchOn: false,
    };
  }

  onSuccess = function(qrResults) {
    this.props.navigation.state.params.qrCodeResult(qrResults.data);
    this.props.navigation.goBack();
  }

  onPress = function() {
    this.props.navigation.goBack();
  }.bind(this)

  onFlash = function() {
    Torch.switchState(!this.state.isTorchOn);
    this.setState({ isTorchOn: !this.state.isTorchOn });
  }.bind(this)

  render = function() {
    return (
      <QRCodeScanner
        onRead={this.onSuccess.bind(this)}
        topViewStyle={styles.topView}
        bottomViewStyle={styles.bottomView}
        topContent={<Text>Scan Myriad Qr Code</Text>}
        showMarker={true}
        bottomContent={
        <View style={styles.buttonContainer}>
          <Button style={styles.returnButton} text="close" onPress={this.onPress}/>
          <Button style={styles.flashButton} text={this.state.isTorchOn ? "flash_off" : "flash_on"} onPress={this.onFlash}/>
        </View>}
        fadeIn={false}
        cameraStyle={styles.container}
      />
    );
  }
};

ScanQr.propTypes = {
  navigation: React.PropTypes.object,
};

export default ScanQr;