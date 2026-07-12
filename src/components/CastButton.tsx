import * as React from 'react'
import { processColor, type ColorValue, type ViewProps } from 'react-native'
import { getHostComponent } from 'react-native-nitro-modules'
import type {
  CastButtonProps as NativeCastButtonProps,
  CastButtonMethods,
} from '../specs/CastButton.nitro'

// Inline mirror of nitrogen/generated/shared/json/CastButtonConfig.json. It
// must live in src/ (not be imported from nitrogen/): builder-bob preserves
// relative paths when emitting lib/commonjs + lib/module, so a source-relative
// `../../nitrogen/...` import would resolve to the non-existent lib/nitrogen/
// for consumers of the `main`/`module` entry points. A jest drift test
// (CastButton.test.tsx) fails the suite if this ever diverges from the
// generated file after `yarn specs`.
const CastButtonConfig = {
  uiViewClassName: 'CastButton',
  supportsRawText: false,
  bubblingEventTypes: {},
  directEventTypes: {},
  validAttributes: {
    tintColor: true,
    hybridRef: true,
  },
}

export interface CastButtonProps extends ViewProps {
  /** Tint color of the Cast icon (any RN `ColorValue`). Omit for the platform default. */
  tintColor?: ColorValue
}

const NativeCastButton = getHostComponent<
  NativeCastButtonProps,
  CastButtonMethods
>('CastButton', () => CastButtonConfig)

// The generated prop is `tintColor?: number` (a processed color int), but the
// E11 reset path must pass an explicit `null` — nitrogen's prop parser keeps
// the cached value when a key is *absent* from the prop diff, so removing the
// prop would strand the old tint. Both native lanes treat null as "reset to
// the default color". Widen the component type once for that null.
const TintResettableCastButton =
  NativeCastButton as unknown as React.ComponentType<
    ViewProps & { tintColor: number | null }
  >

/**
 * Button that displays the Cast icon and automatically changes appearance
 * based on the cast state (available / connecting / connected). Pressing it
 * opens the native Cast dialog.
 *
 * Keeping one mounted also anchors
 * {@link CastContext.showIntroductoryOverlay} and (on Android) triggers GCK's
 * ACTIVE device scan, so devices are discovered while it is on screen.
 *
 * @example
 * ```jsx
 * import { CastButton } from 'react-native-google-cast'
 *
 * <CastButton tintColor="black" style={{ width: 24, height: 24 }} />
 * ```
 */
export function CastButton({ tintColor, ...props }: CastButtonProps) {
  const processed = tintColor != null ? processColor(tintColor) : null
  return (
    <TintResettableCastButton
      {...props}
      // Always include the key (E11): explicit null resets the native default.
      tintColor={typeof processed === 'number' ? processed : null}
    />
  )
}
