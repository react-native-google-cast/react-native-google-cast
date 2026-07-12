import type {
  HybridView,
  HybridViewProps,
  HybridViewMethods,
} from 'react-native-nitro-modules'

/**
 * Nitro view spec for the Cast button (GCKUICastButton / MediaRouteButton).
 *
 * `tintColor` crosses the bridge as a processed AARRGGBB color int (the output
 * of RN's `processColor`) — the React wrapper in `components/CastButton.tsx`
 * converts from `ColorValue` and always includes the key (`?? null`) so a
 * removed prop resets the native default instead of stranding the old tint
 * (E11 — nitrogen's prop parser keeps the cached value for absent keys).
 */
export interface CastButtonProps extends HybridViewProps {
  tintColor?: number
}

export interface CastButtonMethods extends HybridViewMethods {}

export type CastButton = HybridView<CastButtonProps, CastButtonMethods>
