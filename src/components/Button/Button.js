import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import styles from './styles';

const Button = (props) => {
  const { text, onPress, style } = props;
  return (
    <TouchableOpacity style={[style, styles.button]} onPress={onPress}>
      <Text style={styles.buttonText}>
        {text}
      </Text>
    </TouchableOpacity>
  );
};

Button.propTypes = {
  text: React.PropTypes.string,
  onPress: React.PropTypes.func,
};

Button.defaultProps = {
  text: 'Button Text',
  onPress: () => console.log('Button Pressed'),
};

export default Button;
