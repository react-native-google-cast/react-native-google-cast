import Foundation
import GoogleCast

/// Value-based mapping between our `MediaQueueType` union and `GCKMediaQueueType`.
///
/// GCK values: `Generic=0, Album=1, Playlist=2, AudioBook=3, RadioStation=4, PodcastSeries=5,
/// TVSeries=6, VideoPlayList=7, LiveTV=8, Movie=9`. Our union does not model `generic`, so an
/// absent queue type and GCK `Generic` both map to `nil`. Mapped by value — the ordinals
/// differ from our union order.
extension MediaQueueType {
  func toGckQueueType() -> GCKMediaQueueType {
    switch self {
    case .album: return .album
    case .playlist: return .playlist
    case .audiobook: return .audioBook
    case .radiostation: return .radioStation
    case .podcastseries: return .podcastSeries
    case .tvseries: return .tvSeries
    case .videoplaylist: return .videoPlayList
    case .livetv: return .liveTV
    case .movie: return .movie
    }
  }
}

extension GCKMediaQueueType {
  func toMediaQueueType() -> MediaQueueType? {
    switch self {
    case .album: return .album
    case .playlist: return .playlist
    case .audioBook: return .audiobook
    case .radioStation: return .radiostation
    case .podcastSeries: return .podcastseries
    case .tvSeries: return .tvseries
    case .videoPlayList: return .videoplaylist
    case .liveTV: return .livetv
    case .movie: return .movie
    default: return nil  // Generic
    }
  }
}
