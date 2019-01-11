import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  toolbarAndroid: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
  toolbarIOS: {
    marginTop: 20,
    height: 56,
  },
  castButtonAndroid: {
    height: 24,
    width: 24,
    alignSelf: 'flex-end',
    tintColor: 'black',
  },
  castButtonIOS: {
    height: 24,
    width: 24,
    marginRight: 10,
    alignSelf: 'flex-end',
    tintColor: 'black',
  },
  stopButton: {
    alignSelf: 'flex-end',
  },

  button: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 2,
    backgroundColor: '#42A5F5',
  },
  textButton: {
    color: 'white',
    fontWeight: 'bold',
  },
  chromecastButton: {
    backgroundColor: '#EC407A',
    marginVertical: 10,
  },
  disconnectButton: {
    marginVertical: 10,
    backgroundColor: '#f44336',
  },
  controlButton: {
    marginVertical: 10,
    backgroundColor: '#689F38',
  },
})

export default styles
