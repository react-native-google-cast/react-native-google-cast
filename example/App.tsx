/**
 * react-native-google-cast v5 — example app.
 *
 * Phase 3 smoke screen: exercises the v5 façades over the central state machine
 * (sync getCastState / getPlayServicesState + live cast-state subscription +
 * the discovered device list).
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
import GoogleCast, {
  type CastState,
  type Device,
} from 'react-native-google-cast';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const discoveryManager = GoogleCast.getDiscoveryManager();

  const [state, setState] = useState<CastState>(() =>
    GoogleCast.getCastState(),
  );
  const [playServices] = useState(() => GoogleCast.getPlayServicesState());
  const [devices, setDevices] = useState<readonly Device[]>(() =>
    discoveryManager.getDevices(),
  );

  useEffect(() => {
    const castSub = GoogleCast.onCastStateChanged(setState);
    const devicesSub = discoveryManager.onDevicesUpdated(setDevices);
    return () => {
      castSub.remove();
      devicesSub.remove();
    };
  }, [discoveryManager]);

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <Text style={[styles.title, isDarkMode && styles.textLight]}>
          react-native-google-cast v5
        </Text>
        <Text style={[styles.row, isDarkMode && styles.textLight]}>
          Cast state: {state}
        </Text>
        <Text style={[styles.row, isDarkMode && styles.textLight]}>
          Play Services: {playServices}
        </Text>
        <Text style={[styles.row, isDarkMode && styles.textLight]}>
          Devices ({devices.length}):{' '}
          {devices.map(d => d.friendlyName).join(', ') || '—'}
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
