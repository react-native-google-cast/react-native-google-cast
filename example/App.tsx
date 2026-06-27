/**
 * react-native-google-cast v5 — example app.
 *
 * Phase 0+1 spike screen: exercises the Nitro CastTransport directly
 * (isAvailable + getCastState + live cast-state subscription).
 */

import { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import { castTransport, type CastState } from 'react-native-google-cast';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const [available] = useState(() => castTransport.isAvailable);
  const [state, setState] = useState<CastState>(() =>
    castTransport.getCastState()
  );

  useEffect(() => {
    const subscription = castTransport.addCastStateListener(setState);
    return () => subscription.remove();
  }, []);

  return (
    <SafeAreaView style={[styles.container, isDarkMode && styles.containerDark]}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.textLight]}>
          react-native-google-cast v5
        </Text>
        <Text style={[styles.row, isDarkMode && styles.textLight]}>
          Casting available: {available ? 'yes' : 'no'}
        </Text>
        <Text style={[styles.row, isDarkMode && styles.textLight]}>
          Cast state: {state}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#000' },
  content: { flex: 1, justifyContent: 'center', padding: 24, gap: 12 },
  title: { fontSize: 20, fontWeight: '600', marginBottom: 12, color: '#000' },
  row: { fontSize: 16, color: '#000' },
  textLight: { color: '#fff' },
});

export default App;
