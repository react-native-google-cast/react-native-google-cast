import Foundation
import GoogleCast

/// Value-based mapping between our `DeviceCapability` union and GCK's `GCKDeviceCapabilities`
/// option-set bitmask. GCK bits: VideoOut=1<<0, VideoIn=1<<1, AudioOut=1<<2, AudioIn=1<<3,
/// MultizoneGroup=1<<5, DynamicGroup=1<<6, MultiChannelGroup=1<<7. Mapped by value.
///
/// The reverse (bitmask → array) is emitted in a fixed canonical order so round-trips are
/// stable; the corpus must list capabilities in this same order.
///
/// NOTE: `toGckCapability()`/`gckBitmask(_:)` (the struct→bitmask direction) are currently
/// unused on iOS — `GCKDevice` cannot be constructed here, so the reverse `GCKDevice+toDevice`
/// reads bits directly via `hasCapabilities:`. They are retained as the canonical value-mapping
/// reference and for parity with the Android converter.
extension DeviceCapability {
  func toGckCapability() -> GCKDeviceCapabilities {
    switch self {
    case .videoout: return .videoOut
    case .videoin: return .videoIn
    case .audioout: return .audioOut
    case .audioin: return .audioIn
    case .dynamicgroup: return .dynamicGroup
    case .multizonegroup: return .multizoneGroup
    case .multichannelgroup: return .multiChannelGroup
    }
  }

  /// Folds a capability list into a single GCK option-set bitmask.
  static func gckBitmask(_ capabilities: [DeviceCapability]) -> GCKDeviceCapabilities {
    var result: GCKDeviceCapabilities = []
    for capability in capabilities {
      result.insert(capability.toGckCapability())
    }
    return result
  }
}

extension GCKDeviceCapabilities {
  /// Canonical-order expansion of the bitmask into our union values.
  func toDeviceCapabilities() -> [DeviceCapability] {
    var result: [DeviceCapability] = []
    if contains(.videoOut) { result.append(.videoout) }
    if contains(.videoIn) { result.append(.videoin) }
    if contains(.audioOut) { result.append(.audioout) }
    if contains(.audioIn) { result.append(.audioin) }
    if contains(.dynamicGroup) { result.append(.dynamicgroup) }
    if contains(.multizoneGroup) { result.append(.multizonegroup) }
    if contains(.multiChannelGroup) { result.append(.multichannelgroup) }
    return result
  }
}
