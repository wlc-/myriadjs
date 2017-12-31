import { StyleSheet } from 'react-native';
import { colors } from '../../config/styling';

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.grey,
  },
  topView: {
    display: 'none'
  },
  bottomView: {
    flex: 0,
    height: 44,
    backgroundColor: colors.white,
    position: 'relative', 
  },
  returnButton: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  flashButton: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  buttonContainer: {
    flex: 0,
    height: '100%',
    width: '100%',
    position: 'relative',
  }
});