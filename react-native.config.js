const path = require('path');

module.exports = {
  dependency: {
    platforms: {
      ios: {
        podspecPath:
          path.join(__dirname, 'ios', 'react-native-google-cast.podspec'),
      },
    },
  },
}
