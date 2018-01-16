import { StyleSheet } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'stretch',
    backgroundColor: '#F5FCFF',
  },
  toolbar: {
    backgroundColor: '#E9EAED',
    height: 56,
  },
  chromecastAround: {
    fontWeight: 'bold',
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
});

export default styles;
