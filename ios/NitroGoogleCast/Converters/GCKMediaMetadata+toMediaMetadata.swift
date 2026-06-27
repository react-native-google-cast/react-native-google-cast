import Foundation
import GoogleCast
import NitroModules

/// Converts a Google Cast `GCKMediaMetadata` into a generated `MediaMetadata` struct.
///
/// Reverse of `MediaMetadata+toGckMediaMetadata.swift`. Each standard field is read with the
/// GCK field's required typed getter (string / integer / double / date) guarded by
/// `containsKey:`, so a field that is genuinely absent stays `nil` (integer getters would
/// otherwise return `0` for missing fields).
///
/// Standard-vs-custom key rule: a key is "standard" iff it is one of the predefined
/// `kGCKMetadataKey*` constants that maps to a struct field (`Self.standardKeys`). Every
/// other key present in `allKeys` is application-defined and is collected into `customData`.
/// This partition is symmetric with the forward converter and never double-counts a key.
/// Empty collections normalize to `nil` (GCK reports an empty images array / no custom keys
/// for absent data), keeping round-trips stable.
extension GCKMediaMetadata {
  func toMediaMetadata() -> MediaMetadata {
    let mappedImages = (images() as? [GCKImage])?.map { $0.toWebImage() } ?? []

    return MediaMetadata(
      type: metadataType.toMediaMetadataType(),
      images: mappedImages.isEmpty ? nil : mappedImages,
      title: stringIfPresent(kGCKMetadataKeyTitle),
      subtitle: stringIfPresent(kGCKMetadataKeySubtitle),
      artist: stringIfPresent(kGCKMetadataKeyArtist),
      releaseDate: dateStringIfPresent(kGCKMetadataKeyReleaseDate),
      studio: stringIfPresent(kGCKMetadataKeyStudio),
      albumTitle: stringIfPresent(kGCKMetadataKeyAlbumTitle),
      albumArtist: stringIfPresent(kGCKMetadataKeyAlbumArtist),
      composer: stringIfPresent(kGCKMetadataKeyComposer),
      discNumber: integerIfPresent(kGCKMetadataKeyDiscNumber),
      trackNumber: integerIfPresent(kGCKMetadataKeyTrackNumber),
      creationDate: dateStringIfPresent(kGCKMetadataKeyCreationDate),
      location: stringIfPresent(kGCKMetadataKeyLocationName),
      latitude: doubleIfPresent(kGCKMetadataKeyLocationLatitude),
      longitude: doubleIfPresent(kGCKMetadataKeyLocationLongitude),
      width: integerIfPresent(kGCKMetadataKeyWidth),
      height: integerIfPresent(kGCKMetadataKeyHeight),
      broadcastDate: dateStringIfPresent(kGCKMetadataKeyBroadcastDate),
      episodeNumber: integerIfPresent(kGCKMetadataKeyEpisodeNumber),
      seasonNumber: integerIfPresent(kGCKMetadataKeySeasonNumber),
      seriesTitle: stringIfPresent(kGCKMetadataKeySeriesTitle),
      customData: extractCustomData()
    )
  }

  // MARK: - Typed presence-guarded readers

  private func stringIfPresent(_ key: String) -> String? {
    return containsKey(key) ? string(forKey: key) : nil
  }

  private func dateStringIfPresent(_ key: String) -> String? {
    return containsKey(key) ? dateAsString(forKey: key) : nil
  }

  private func integerIfPresent(_ key: String) -> Double? {
    return containsKey(key) ? Double(integer(forKey: key)) : nil
  }

  private func doubleIfPresent(_ key: String) -> Double? {
    return containsKey(key) ? double(forKey: key) : nil
  }

  // MARK: - Custom data partition

  /// The predefined keys consumed by struct fields. Anything else is application-defined.
  private static let standardKeys: Set<String> = [
    kGCKMetadataKeyTitle, kGCKMetadataKeySubtitle, kGCKMetadataKeyArtist,
    kGCKMetadataKeyReleaseDate, kGCKMetadataKeyStudio, kGCKMetadataKeyAlbumTitle,
    kGCKMetadataKeyAlbumArtist, kGCKMetadataKeyComposer, kGCKMetadataKeyDiscNumber,
    kGCKMetadataKeyTrackNumber, kGCKMetadataKeyCreationDate, kGCKMetadataKeyLocationName,
    kGCKMetadataKeyLocationLatitude, kGCKMetadataKeyLocationLongitude, kGCKMetadataKeyWidth,
    kGCKMetadataKeyHeight, kGCKMetadataKeyBroadcastDate, kGCKMetadataKeyEpisodeNumber,
    kGCKMetadataKeySeasonNumber, kGCKMetadataKeySeriesTitle,
  ]

  private func extractCustomData() -> AnyMap? {
    let customKeys = allKeys().filter { !Self.standardKeys.contains($0) }
    if customKeys.isEmpty {
      return nil
    }
    let map = AnyMap()
    for key in customKeys {
      let value = object(forKey: key)
      if let string = value as? String {
        map.setString(key: key, value: string)
      } else if let number = value as? NSNumber {
        map.setDouble(key: key, value: number.doubleValue)
      }
    }
    return map
  }
}
