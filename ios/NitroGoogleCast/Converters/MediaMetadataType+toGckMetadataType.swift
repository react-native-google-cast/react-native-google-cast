import Foundation
import GoogleCast

/// Maps our `MediaMetadataType` to Google Cast's `GCKMediaMetadataType` by VALUE.
///
/// The two enums do NOT share ordinals — our union order is
/// `generic, movie, musicTrack, photo, tvShow, user` while GCK is
/// `generic=0, movie=1, tvShow=2, musicTrack=3, photo=4, user=100`. Mapping by raw
/// value/ordinal would silently corrupt the type, so each case is mapped explicitly.
extension MediaMetadataType {
  func toGckMetadataType() -> GCKMediaMetadataType {
    switch self {
    case .generic:
      return .generic
    case .movie:
      return .movie
    case .musictrack:
      return .musicTrack
    case .photo:
      return .photo
    case .tvshow:
      return .tvShow
    case .user:
      return .user
    }
  }
}
