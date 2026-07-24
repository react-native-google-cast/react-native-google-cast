import type { ColorValue, ViewProps } from 'react-native'

export interface CastButtonProps extends ViewProps {
  /** Tint color of the Cast icon (any RN `ColorValue`). Omit for the platform default. */
  tintColor?: ColorValue
}

/**
 * Web build of {@link CastButton}: renders nothing (E3).
 *
 * The native wrapper's `getHostComponent` deep-imports React Native
 * internals that react-native-web does not provide, so this split keeps the
 * import out of web *bundles* entirely. The web transport itself is real
 * (Cast Web Sender SDK) — trigger the browser's Cast picker with
 * `CastContext.showCastDialog()` (or render the SDK's
 * `<google-cast-launcher>` element yourself); a first-party web button is
 * tracked separately.
 */
export function CastButton(_props: CastButtonProps): null {
  return null
}
