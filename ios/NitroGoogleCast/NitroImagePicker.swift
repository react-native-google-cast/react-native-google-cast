import GoogleCast

/// v4-Android-parity default image picker (design §iOS, E1). Installed by the
/// transport iff the consumer hasn't set one (contract i).
final class NitroImagePicker: NSObject, GCKUIImagePicker {
  /// Pure heuristic — pinned by fixtures/cast-options/heuristics.json (E3):
  /// empty → nil; single → first; `.castDialog` (the analogue of v4-Android's
  /// IMAGE_TYPE_MEDIA_ROUTE_CONTROLLER_DIALOG_BACKGROUND) → first; else second.
  static func pickImage(
    from images: [GCKImage], imageType: GCKMediaMetadataImageType
  ) -> GCKImage? {
    guard let first = images.first else { return nil }
    if images.count == 1 || imageType == .castDialog { return first }
    return images[1]
  }

  /// GCK's internal default picker class. The design assumed an unset
  /// `GCKCastContext.imagePicker` reads `nil` (the header declares the property
  /// nullable), but the contract-i pin test proved otherwise on GCK 4.8.4: the
  /// getter returns an internal `GCKUIDefaultImagePicker` instance when the app
  /// never set one. "Absent" therefore means nil OR that internal default.
  /// If a GCK upgrade renames the class, the guarded singleton pin test fails
  /// loudly (the safety property the design demanded) instead of this library
  /// silently never installing its picker.
  private static let gckDefaultPickerClassName = "GCKUIDefaultImagePicker"

  /// Contract-i install decision, seam-tested without the singleton (E9):
  /// returns the picker to install, or nil to leave the current one alone.
  /// A consumer-set picker (assigned in AppDelegate, which runs before the
  /// transport init) is never clobbered; GCK's own unset-state default is.
  static func installIfAbsent(current: GCKUIImagePicker?) -> GCKUIImagePicker? {
    guard let current else { return NitroImagePicker() }
    if NSStringFromClass(type(of: current)) == gckDefaultPickerClassName {
      return NitroImagePicker()
    }
    return nil
  }

  func getImageWith(
    _ imageHints: GCKUIImageHints, from metadata: GCKMediaMetadata
  ) -> GCKImage? {
    Self.pickImage(
      from: metadata.images().compactMap { $0 as? GCKImage },
      imageType: imageHints.imageType)
  }
}
