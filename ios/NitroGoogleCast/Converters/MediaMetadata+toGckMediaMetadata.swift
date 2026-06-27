import Foundation
import GoogleCast
import NitroModules

/// Converts a generated `MediaMetadata` struct into a Google Cast `GCKMediaMetadata`.
///
/// Part of the per-platform struct↔GCK converter layer (Phase 2 / T1). The reverse
/// direction lives in `GCKMediaMetadata+toMediaMetadata.swift`.
///
/// Mapping rules (kept symmetric with the reverse converter):
/// - `type` is mapped by VALUE, not ordinal — our union order differs from GCK's enum.
/// - Standard fields map to the predefined `kGCKMetadataKey*` constants with the GCK
///   field's required value type (string / integer / double / date). The three date keys
///   (`releaseDate`, `creationDate`, `broadcastDate`) are NSDate fields, so they are written
///   with `setDate:` (writing a string would raise `NSInvalidArgumentException`).
/// - `images` are appended via `addImage:` using the shared `WebImage` converter.
/// - `customData` carries application-defined keys: each entry is written under its own key
///   (string → `setString:`, number → `setDouble:`). These must not collide with the
///   predefined standard keys; the reverse converter treats any non-standard key as custom.
extension MediaMetadata {
  func toGckMediaMetadata() -> GCKMediaMetadata {
    let gck = GCKMediaMetadata(metadataType: type.toGckMetadataType())

    for image in images ?? [] {
      gck.addImage(image.toGckImage())
    }

    // String fields.
    if let title { gck.setString(title, forKey: kGCKMetadataKeyTitle) }
    if let subtitle { gck.setString(subtitle, forKey: kGCKMetadataKeySubtitle) }
    if let artist { gck.setString(artist, forKey: kGCKMetadataKeyArtist) }
    if let studio { gck.setString(studio, forKey: kGCKMetadataKeyStudio) }
    if let albumTitle { gck.setString(albumTitle, forKey: kGCKMetadataKeyAlbumTitle) }
    if let albumArtist { gck.setString(albumArtist, forKey: kGCKMetadataKeyAlbumArtist) }
    if let composer { gck.setString(composer, forKey: kGCKMetadataKeyComposer) }
    if let location { gck.setString(location, forKey: kGCKMetadataKeyLocationName) }
    if let seriesTitle { gck.setString(seriesTitle, forKey: kGCKMetadataKeySeriesTitle) }

    // Integer fields.
    if let discNumber { gck.setInteger(Int(discNumber), forKey: kGCKMetadataKeyDiscNumber) }
    if let trackNumber { gck.setInteger(Int(trackNumber), forKey: kGCKMetadataKeyTrackNumber) }
    if let width { gck.setInteger(Int(width), forKey: kGCKMetadataKeyWidth) }
    if let height { gck.setInteger(Int(height), forKey: kGCKMetadataKeyHeight) }
    if let episodeNumber {
      gck.setInteger(Int(episodeNumber), forKey: kGCKMetadataKeyEpisodeNumber)
    }
    if let seasonNumber {
      gck.setInteger(Int(seasonNumber), forKey: kGCKMetadataKeySeasonNumber)
    }

    // Double fields.
    if let latitude { gck.setDouble(latitude, forKey: kGCKMetadataKeyLocationLatitude) }
    if let longitude { gck.setDouble(longitude, forKey: kGCKMetadataKeyLocationLongitude) }

    // Date fields (NSDate-typed; written from ISO-8601 strings).
    if let releaseDate, let date = MediaMetadata.parseIso8601(releaseDate) {
      gck.setDate(date, forKey: kGCKMetadataKeyReleaseDate)
    }
    if let creationDate, let date = MediaMetadata.parseIso8601(creationDate) {
      gck.setDate(date, forKey: kGCKMetadataKeyCreationDate)
    }
    if let broadcastDate, let date = MediaMetadata.parseIso8601(broadcastDate) {
      gck.setDate(date, forKey: kGCKMetadataKeyBroadcastDate)
    }

    // Application-defined custom keys.
    if let customData {
      for key in customData.getAllKeys() {
        if customData.isString(key: key) {
          gck.setString(customData.getString(key: key), forKey: key)
        } else if customData.isDouble(key: key) {
          gck.setDouble(customData.getDouble(key: key), forKey: key)
        } else if customData.isInt64(key: key) {
          gck.setDouble(Double(customData.getInt64(key: key)), forKey: key)
        }
      }
    }

    return gck
  }

  /// Parses an ISO-8601 string into a `Date`, accepting both full date-times and
  /// date-only (`yyyy-MM-dd`) forms. Returns `nil` if neither parses.
  static func parseIso8601(_ string: String) -> Date? {
    let dateTime = ISO8601DateFormatter()
    if let date = dateTime.date(from: string) {
      return date
    }
    let dateOnly = ISO8601DateFormatter()
    dateOnly.formatOptions = [.withFullDate]
    return dateOnly.date(from: string)
  }
}
