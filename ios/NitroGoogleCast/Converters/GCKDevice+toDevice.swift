import Foundation
import GoogleCast

/// Converts a `GCKDevice` into a generated `Device` struct.
///
/// `GCKDevice` is a receive-only GCK type (`init` is `NS_UNAVAILABLE`); this GCK→struct
/// direction is the one used in the real app. Capabilities are read through `hasCapabilities:`
/// in canonical order. `friendlyName`/`modelName`/`deviceVersion` are nullable in GCK; absent
/// values become `""`. `isOnLocalNetwork` is non-optional `BOOL` in GCK, so it is always
/// emitted (the reverse never produces `nil`).
extension GCKDevice {
  func toDevice() -> Device {
    var capabilities: [DeviceCapability] = []
    if hasCapabilities(.videoOut) { capabilities.append(.videoout) }
    if hasCapabilities(.videoIn) { capabilities.append(.videoin) }
    if hasCapabilities(.audioOut) { capabilities.append(.audioout) }
    if hasCapabilities(.audioIn) { capabilities.append(.audioin) }
    if hasCapabilities(.dynamicGroup) { capabilities.append(.dynamicgroup) }
    if hasCapabilities(.multizoneGroup) { capabilities.append(.multizonegroup) }
    if hasCapabilities(.multiChannelGroup) { capabilities.append(.multichannelgroup) }

    let mappedIcons = (icons ?? []).map { $0.toWebImage() }

    return Device(
      capabilities: capabilities,
      deviceId: deviceID,
      deviceVersion: deviceVersion ?? "",
      friendlyName: friendlyName ?? "",
      icons: mappedIcons,
      ipAddress: ipAddress,
      isOnLocalNetwork: isOnLocalNetwork,
      modelName: modelName ?? ""
    )
  }
}
