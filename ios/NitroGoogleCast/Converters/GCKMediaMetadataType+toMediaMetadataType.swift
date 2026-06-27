import Foundation
import GoogleCast

/// Maps Google Cast's `GCKMediaMetadataType` back to our `MediaMetadataType` by VALUE.
///
/// Reverse of `MediaMetadataType+toGckMetadataType.swift`. GCK exposes types our union
/// does not model (`audioBookChapter`, and arbitrary application-defined values `>= user`).
/// Application-defined types collapse to `.user`; any other unmodelled value falls back to
/// `.generic` (GCK's own default metadata type).
extension GCKMediaMetadataType {
  func toMediaMetadataType() -> MediaMetadataType {
    switch self {
    case .generic:
      return .generic
    case .movie:
      return .movie
    case .musicTrack:
      return .musictrack
    case .photo:
      return .photo
    case .tvShow:
      return .tvshow
    default:
      // `user` and any application-defined type (>= GCKMediaMetadataTypeUser).
      if rawValue >= GCKMediaMetadataType.user.rawValue {
        return .user
      }
      return .generic
    }
  }
}
