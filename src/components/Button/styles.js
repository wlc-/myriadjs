import { StyleSheet } from 'react-native';
import { colors, fontStack } from '../../config/styling';

export default StyleSheet.create({
  button: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.white,
    margin: 0,
  },
  buttonText: {
    color: colors.black,
    fontSize: 24,
    fontWeight: 'normal',
    fontFamily: fontStack.icons
  },
});
