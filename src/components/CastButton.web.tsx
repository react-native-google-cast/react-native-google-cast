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
 * import out of web *bundles* entirely. A real web Cast button ships with the
 * Phase 8 web transport; until then this matches the web transport stub
 * (Cast UI is never shown on web).
 */
export function CastButton(_props: CastButtonProps): null {
  return null
}
