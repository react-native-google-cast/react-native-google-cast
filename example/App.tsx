/**
 * react-native-google-cast v5 — example app + Phase 3 native-spike harness.
 *
 * Exercises the v5 façades over the central state machine and makes the
 * device-gated spike assertions observable:
 *  - 0.1 event stream: live cast-state, device list, and a session-lifecycle log.
 *  - 0.2 error propagation (#12): "Probe error" runs a failing mutation and shows
 *    the caught CastError's `code` + `nativeCode` (the load-bearing unknown).
 *  - 0.3 teardown: reload the app (Fast Refresh) and confirm no leaked listeners.
 */

import { useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useColorScheme,
  View,
} from 'react-native';
import GoogleCast, {
  CastButton,
  type CastError,
  type CastState,
  type Device,
} from 'react-native-google-cast';

function App() {
  const isDarkMode = useColorScheme() === 'dark';
  const sessionManager = GoogleCast.getSessionManager();
  const discoveryManager = GoogleCast.getDiscoveryManager();

  const [state, setState] = useState<CastState>(() =>
    GoogleCast.getCastState(),
  );
  const [playServices] = useState(() => GoogleCast.getPlayServicesState());
  const [devices, setDevices] = useState<readonly Device[]>(() =>
    discoveryManager.getDevices(),
  );
  const [log, setLog] = useState<string[]>([]);

  const seq = useRef(0);
  const append = (line: string) => {
    const entry = `${++seq.current} · ${line}`;
    console.log(`[SPIKE] ${entry}`);
    setLog(prev => [entry, ...prev].slice(0, 60));
  };

  useEffect(() => {
    const subs = [
      GoogleCast.onCastStateChanged(s => {
        setState(s);
        append(`castState → ${s}`);
      }),
      discoveryManager.onDevicesUpdated(d => {
        setDevices(d);
        append(`devices → [${d.map(x => x.friendlyName).join(', ')}]`);
      }),
      sessionManager.onSessionStarting(s =>
        append(`starting (${s?.id ?? '—'})`),
      ),
      sessionManager.onSessionStarted(s => append(`started (${s?.id ?? '—'})`)),
      sessionManager.onSessionStartFailed((_s, e) =>
        append(`startFailed: ${e?.code} / native ${e?.nativeCode}`),
      ),
      sessionManager.onSessionEnding(s => append(`ending (${s?.id ?? '—'})`)),
      sessionManager.onSessionEnded((_s, e) =>
        append(`ended${e ? `: ${e.code} / native ${e.nativeCode}` : ''}`),
      ),
      sessionManager.onSessionResuming(() => append('resuming')),
      sessionManager.onSessionResumed(s => append(`resumed (${s?.id ?? '—'})`)),
      sessionManager.onSessionResumeFailed((_s, e) =>
        append(`resumeFailed: ${e?.code} / native ${e?.nativeCode}`),
      ),
      sessionManager.onSessionSuspended(() => append('suspended')),
    ];
    return () => subs.forEach(s => s.remove());
  }, [sessionManager, discoveryManager]);

  // Spike 0.2 — a deliberately failing mutation; the caught CastError must carry
  // `code` + `nativeCode` across the Nitro bridge.
  const probeError = async () => {
    try {
      await sessionManager.startSession('bogus-device-id');
      append('probe: startSession(bogus) RESOLVED (unexpected)');
    } catch (e) {
      const err = e as CastError;
      append(
        `probe: rejected code=${err.code} native=${err.nativeCode} msg=${err.message}`,
      );
    }
  };

  const startReal = async (device: Device) => {
    try {
      await sessionManager.startSession(device.deviceId);
      append(`startSession(${device.friendlyName}) accepted`);
    } catch (e) {
      const err = e as CastError;
      append(`startSession rejected: ${err.code} / native ${err.nativeCode}`);
    }
  };

  const endSession = async () => {
    try {
      await sessionManager.endCurrentSession(false);
      append('endCurrentSession accepted');
    } catch (e) {
      const err = e as CastError;
      append(`endCurrentSession rejected: ${err.code} / ${err.nativeCode}`);
    }
  };

  // Log the initial seed once after mount (mirrored to console for logcat).
  useEffect(() => {
    append(
      `init seed: castState=${GoogleCast.getCastState()} playServices=${GoogleCast.getPlayServicesState()} devices=${
        discoveryManager.getDevices().length
      }`,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Phase 6.1 — Cast UI one-shots; each logs its boolean resolution (or the
  // typed CastError) into the event log for the device pass.
  const probeShow = async (
    name: string,
    call: () => Promise<boolean>,
  ) => {
    try {
      const shown = await call();
      append(`${name} → ${shown}`);
    } catch (e) {
      const err = e as CastError;
      append(`${name} rejected: ${err.code} / ${err.message}`);
    }
  };

  const text = [styles.text, isDarkMode && styles.textLight];

  return (
    <SafeAreaView
      style={[styles.container, isDarkMode && styles.containerDark]}
    >
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, isDarkMode && styles.textLight]}>
            react-native-google-cast v5 — spike
          </Text>
          <CastButton
            style={styles.castButton}
            tintColor={isDarkMode ? '#fff' : '#1a73e8'}
          />
        </View>
        <Text style={text}>Cast state: {state}</Text>
        <Text style={text}>Play Services: {playServices}</Text>
        <Text style={text}>Devices: {devices.length}</Text>

        <View style={styles.buttons}>
          <Pressable style={styles.button} onPress={probeError}>
            <Text style={styles.buttonText}>Probe error (#12)</Text>
          </Pressable>
          <Pressable style={styles.button} onPress={endSession}>
            <Text style={styles.buttonText}>End session</Text>
          </Pressable>
        </View>

        <View style={styles.buttons}>
          <Pressable
            style={styles.button}
            onPress={() => probeShow('showCastDialog', GoogleCast.showCastDialog)}
          >
            <Text style={styles.buttonText}>Dialog</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() =>
              probeShow('showExpandedControls', GoogleCast.showExpandedControls)
            }
          >
            <Text style={styles.buttonText}>Expanded</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() =>
              probeShow('showIntroductoryOverlay', () =>
                GoogleCast.showIntroductoryOverlay(),
              )
            }
          >
            <Text style={styles.buttonText}>Overlay</Text>
          </Pressable>
          <Pressable
            style={styles.button}
            onPress={() =>
              probeShow('overlay(once:false)', () =>
                GoogleCast.showIntroductoryOverlay({ once: false }),
              )
            }
          >
            <Text style={styles.buttonText}>Overlay∞</Text>
          </Pressable>
        </View>

        {devices.map(d => (
          <Pressable
            key={d.deviceId}
            style={[styles.button, styles.deviceButton]}
            onPress={() => startReal(d)}
          >
            <Text style={styles.buttonText}>▶ {d.friendlyName}</Text>
          </Pressable>
        ))}

        <Text style={[styles.logTitle, isDarkMode && styles.textLight]}>
          Event log
        </Text>
        <ScrollView style={styles.logBox}>
          {log.map((line, i) => (
            <Text key={i} style={styles.logLine}>
              {line}
            </Text>
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  containerDark: { backgroundColor: '#000' },
  content: { flex: 1, padding: 20, gap: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 4, color: '#000' },
  castButton: { width: 28, height: 28 },
  text: { fontSize: 15, color: '#000' },
  textLight: { color: '#fff' },
  buttons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  button: {
    backgroundColor: '#1a73e8',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  deviceButton: { backgroundColor: '#188038', marginTop: 6 },
  buttonText: { color: '#fff', fontWeight: '600' },
  logTitle: { fontSize: 15, fontWeight: '600', marginTop: 12, color: '#000' },
  logBox: { flex: 1, backgroundColor: '#1112', borderRadius: 8, padding: 8 },
  logLine: { fontFamily: 'Courier', fontSize: 12, color: '#888' },
});

export default App;
