import * as React from 'react'
import {
  processColor,
  View,
  type ColorValue,
  type ViewProps,
} from 'react-native'
import { isSdkPresent, subscribeSdkAvailability } from '../transport/webSdk'

export interface CastButtonProps extends ViewProps {
  /** Tint color of the Cast icon (any RN `ColorValue`). Omit for the platform default. */
  tintColor?: ColorValue
}

/**
 * Convert an RN `ColorValue` to a CSS color string for the launcher's
 * `--connected-color` / `--disconnected-color` custom properties. String
 * colors pass through (RN's color syntax — names, hex incl. #rrggbbaa,
 * rgb()/rgba()/hsl() — is CSS-compatible); anything else (`PlatformColor`,
 * numeric colors) goes through `processColor` and its 0xAARRGGBB int is
 * rendered as `rgba()`.
 */
function toCssColor(color: ColorValue | undefined): string | undefined {
  if (color == null) return undefined
  if (typeof color === 'string') return color
  const processed = processColor(color)
  if (typeof processed !== 'number') return undefined
  /* eslint-disable no-bitwise -- unpacking the processed 0xAARRGGBB color int */
  const argb = processed >>> 0
  const a = (argb >>> 24) & 0xff
  const r = (argb >>> 16) & 0xff
  const g = (argb >>> 8) & 0xff
  const b = argb & 0xff
  /* eslint-enable no-bitwise */
  return `rgba(${r}, ${g}, ${b}, ${Math.round((a / 255) * 1000) / 1000})`
}

/**
 * Web build of {@link CastButton}: renders the Cast Web Sender framework's
 * `<google-cast-launcher>` custom element
 * (https://developers.google.com/cast/docs/web_sender/integrate#add_a_cast_button),
 * whose appearance, visibility, and click handling (opening the browser's
 * Cast picker) are managed entirely by the CAF framework.
 *
 * Matches the native prop surface where the web SDK allows:
 * - `tintColor` maps to the launcher's documented `--connected-color` and
 *   `--disconnected-color` CSS custom properties (both, so the single native
 *   tint semantic carries over).
 * - `style` + remaining `ViewProps` go to a react-native-web `View` wrapper;
 *   the launcher fills it (size it like on native, e.g.
 *   `style={{ width: 24, height: 24 }}` — it has no intrinsic size).
 *
 * Until the SDK announces readiness through the `__onGCastApiAvailable`
 * handshake (see `transport/webSdk.ts`) it renders nothing, and if the page
 * never loads the sender script — or the browser is not Chromium-based — it
 * stays `null` forever: graceful no-op, nothing crashes (also under
 * jest/jsdom, where no SDK globals exist).
 *
 * This file is resolved via the `.web.tsx` extension, so `react-native`
 * imports resolve to react-native-web and the native wrapper's
 * `getHostComponent` (which deep-imports RN internals react-native-web does
 * not provide) never enters web bundles.
 */
export function CastButton({ tintColor, ...props }: CastButtonProps) {
  const sdkReady = React.useSyncExternalStore(
    subscribeSdkAvailability,
    isSdkPresent,
    // Server snapshot: the SDK can never be present during SSR.
    () => false
  )
  if (!sdkReady) return null

  const css = toCssColor(tintColor)
  const launcherStyle: Record<string, string> = {
    display: 'block',
    width: '100%',
    height: '100%',
    cursor: 'pointer',
  }
  if (css !== undefined) {
    launcherStyle['--connected-color'] = css
    launcherStyle['--disconnected-color'] = css
  }
  return (
    <View {...props}>
      {
        // createElement (not JSX) so the custom element needs no global
        // IntrinsicElements augmentation, which would leak into the
        // published .d.ts.
        React.createElement('google-cast-launcher', { style: launcherStyle })
      }
    </View>
  )
}
