#!/usr/bin/env bash
# Tier-1 Maestro E2E (T3) — Android, local runner.
#
# Builds the playground DEBUG APK with the JS bundle baked in (-PbundleInDebug=true,
# so no Metro server is needed), installs it on the connected emulator/device,
# and runs the tier-1 Maestro flow against the debug-only native fake seam.
#
# Prereqs: a booted emulator or connected device (`adb devices`), the Maestro
# CLI (https://maestro.mobile.dev — `curl -fsSL https://get.maestro.mobile.dev | bash`),
# and JAVA_HOME pointing at a JDK 17 (on macOS with Android Studio:
# export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home").
#
# Optional: REACT_NATIVE_ARCHITECTURES=x86_64 to build a single ABI (faster).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"

gradle_args=(":app:assembleDebug" "-PbundleInDebug=true")
if [ -n "${REACT_NATIVE_ARCHITECTURES:-}" ]; then
  gradle_args+=("-PreactNativeArchitectures=${REACT_NATIVE_ARCHITECTURES}")
fi

(cd "$root/playground/android" && ./gradlew "${gradle_args[@]}")

adb install -r "$root/playground/android/app/build/outputs/apk/debug/app-debug.apk"

maestro test "$root/.maestro/tier1-fake-session.yml"
