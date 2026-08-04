import Foundation
import NitroModules

@testable import NitroGoogleCast

/// Loads the shared golden-fixture corpus (the JSON files under repo-root
/// `fixtures/converters`, copied into the test bundle) and builds generated structs from
/// the JSON. The same files are consumed by the Android suite, so the expected values are
/// the single cross-platform source of truth.
enum ConverterFixtures {
  struct Fixture {
    let name: String
    let input: [String: Any]
    let expectedRoundTrip: [String: Any]
  }

  /// Loads the `fixtures` array from `<name>.json` in the test bundle.
  static func load(_ name: String) -> [Fixture] {
    guard
      let url = Bundle(for: BundleToken.self).url(forResource: name, withExtension: "json")
    else {
      fatalError("Fixture resource \(name).json not found in test bundle")
    }
    guard
      let data = try? Data(contentsOf: url),
      let root = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
      let fixtures = root["fixtures"] as? [[String: Any]]
    else {
      fatalError("Fixture \(name).json is malformed")
    }
    return fixtures.map { fixture in
      Fixture(
        name: fixture["name"] as? String ?? "<unnamed>",
        input: fixture["input"] as? [String: Any] ?? [:],
        expectedRoundTrip: fixture["expectedRoundTrip"] as? [String: Any] ?? [:]
      )
    }
  }

  // MARK: - Struct builders

  static func webImage(from json: [String: Any]) -> WebImage {
    return WebImage(
      url: json["url"] as? String ?? "",
      width: number(json["width"]),
      height: number(json["height"])
    )
  }

  static func mediaMetadata(from json: [String: Any]) -> MediaMetadata {
    let typeString = json["type"] as? String ?? "generic"
    let type = MediaMetadataType(fromString: typeString) ?? .generic
    let images = (json["images"] as? [[String: Any]])?.map { webImage(from: $0) }
    return MediaMetadata(
      type: type,
      images: images,
      title: json["title"] as? String,
      subtitle: json["subtitle"] as? String,
      artist: json["artist"] as? String,
      releaseDate: json["releaseDate"] as? String,
      studio: json["studio"] as? String,
      albumTitle: json["albumTitle"] as? String,
      albumArtist: json["albumArtist"] as? String,
      composer: json["composer"] as? String,
      discNumber: number(json["discNumber"]),
      trackNumber: number(json["trackNumber"]),
      creationDate: json["creationDate"] as? String,
      location: json["location"] as? String,
      latitude: number(json["latitude"]),
      longitude: number(json["longitude"]),
      width: number(json["width"]),
      height: number(json["height"]),
      broadcastDate: json["broadcastDate"] as? String,
      episodeNumber: number(json["episodeNumber"]),
      seasonNumber: number(json["seasonNumber"]),
      seriesTitle: json["seriesTitle"] as? String,
      customData: anyMap(json["customData"])
    )
  }

  static func mediaTrack(from json: [String: Any]) -> MediaTrack {
    return MediaTrack(
      id: number(json["id"]) ?? 0,
      type: MediaTrackType(fromString: json["type"] as? String ?? "audio") ?? .audio,
      contentId: json["contentId"] as? String,
      contentType: json["contentType"] as? String,
      language: json["language"] as? String,
      name: json["name"] as? String,
      subtype: (json["subtype"] as? String).flatMap { MediaTrackSubtype(fromString: $0) },
      customData: anyMap(json["customData"])
    )
  }

  static func textTrackStyle(from json: [String: Any]) -> TextTrackStyle {
    return TextTrackStyle(
      backgroundColor: json["backgroundColor"] as? String,
      edgeColor: json["edgeColor"] as? String,
      edgeType: (json["edgeType"] as? String).flatMap { TextTrackEdgeType(fromString: $0) },
      fontFamily: json["fontFamily"] as? String,
      fontGenericFamily: (json["fontGenericFamily"] as? String).flatMap {
        TextTrackFontGenericFamily(fromString: $0)
      },
      fontScale: number(json["fontScale"]),
      fontStyle: (json["fontStyle"] as? String).flatMap { TextTrackFontStyle(fromString: $0) },
      foregroundColor: json["foregroundColor"] as? String,
      windowColor: json["windowColor"] as? String,
      windowCornerRadius: number(json["windowCornerRadius"]),
      windowType: (json["windowType"] as? String).flatMap { TextTrackWindowType(fromString: $0) },
      customData: anyMap(json["customData"])
    )
  }

  static func videoInfo(from json: [String: Any]) -> VideoInfo {
    return VideoInfo(
      hdrType: (json["hdrType"] as? String).flatMap { VideoHdrType(fromString: $0) },
      width: number(json["width"]),
      height: number(json["height"])
    )
  }

  static func mediaSeekOptions(from json: [String: Any]) -> MediaSeekOptions {
    return MediaSeekOptions(
      position: number(json["position"]),
      relative: json["relative"] as? Bool,
      infinite: json["infinite"] as? Bool,
      resumeState: (json["resumeState"] as? String).flatMap {
        MediaSeekResumeState(fromString: $0)
      },
      customData: anyMap(json["customData"])
    )
  }

  static func mediaInfo(from json: [String: Any]) -> MediaInfo {
    return MediaInfo(
      contentUrl: json["contentUrl"] as? String ?? "",
      contentId: json["contentId"] as? String,
      contentType: json["contentType"] as? String,
      entity: json["entity"] as? String,
      streamType: (json["streamType"] as? String).flatMap { MediaStreamType(fromString: $0) },
      metadata: (json["metadata"] as? [String: Any]).map { mediaMetadata(from: $0) },
      streamDuration: number(json["streamDuration"]),
      mediaTracks: (json["mediaTracks"] as? [[String: Any]])?.map { mediaTrack(from: $0) },
      textTrackStyle: (json["textTrackStyle"] as? [String: Any]).map { textTrackStyle(from: $0) },
      hlsSegmentFormat: (json["hlsSegmentFormat"] as? String).flatMap {
        MediaHlsSegmentFormat(fromString: $0)
      },
      hlsVideoSegmentFormat: (json["hlsVideoSegmentFormat"] as? String).flatMap {
        MediaHlsVideoSegmentFormat(fromString: $0)
      },
      customData: anyMap(json["customData"])
    )
  }

  static func mediaQueueItem(from json: [String: Any]) -> MediaQueueItem {
    return MediaQueueItem(
      mediaInfo: mediaInfo(from: json["mediaInfo"] as? [String: Any] ?? [:]),
      itemId: number(json["itemId"]),
      activeTrackIds: (json["activeTrackIds"] as? [Any])?.compactMap { number($0) },
      autoplay: json["autoplay"] as? Bool,
      playbackDuration: number(json["playbackDuration"]),
      preloadTime: number(json["preloadTime"]),
      startTime: number(json["startTime"]),
      customData: anyMap(json["customData"])
    )
  }

  static func mediaQueueContainerMetadata(
    from json: [String: Any]
  ) -> MediaQueueContainerMetadata {
    return MediaQueueContainerMetadata(
      containerType: (json["containerType"] as? String).flatMap {
        MediaQueueContainerType(fromString: $0)
      },
      title: json["title"] as? String,
      containerDuration: number(json["containerDuration"]),
      containerImages: (json["containerImages"] as? [[String: Any]])?.map { webImage(from: $0) },
      sections: (json["sections"] as? [[String: Any]])?.map { mediaMetadata(from: $0) }
    )
  }

  static func mediaQueueData(from json: [String: Any]) -> MediaQueueData {
    return MediaQueueData(
      id: json["id"] as? String,
      name: json["name"] as? String,
      entity: json["entity"] as? String,
      type: (json["type"] as? String).flatMap { MediaQueueType(fromString: $0) },
      repeatMode: (json["repeatMode"] as? String).flatMap { MediaRepeatMode(fromString: $0) },
      containerMetadata: (json["containerMetadata"] as? [String: Any]).map {
        mediaQueueContainerMetadata(from: $0)
      },
      items: (json["items"] as? [[String: Any]])?.map { mediaQueueItem(from: $0) },
      startIndex: number(json["startIndex"]),
      startTime: number(json["startTime"])
    )
  }

  static func mediaLoadRequest(from json: [String: Any]) -> MediaLoadRequest {
    return MediaLoadRequest(
      mediaInfo: (json["mediaInfo"] as? [String: Any]).map { mediaInfo(from: $0) },
      queueData: (json["queueData"] as? [String: Any]).map { mediaQueueData(from: $0) },
      autoplay: json["autoplay"] as? Bool,
      startTime: number(json["startTime"]),
      playbackRate: number(json["playbackRate"]),
      credentials: json["credentials"] as? String,
      credentialsType: json["credentialsType"] as? String,
      customData: anyMap(json["customData"])
    )
  }

  static func device(from json: [String: Any]) -> Device {
    let caps =
      (json["capabilities"] as? [String])?.compactMap { DeviceCapability(fromString: $0) } ?? []
    let icons = (json["icons"] as? [[String: Any]])?.map { webImage(from: $0) } ?? []
    return Device(
      capabilities: caps,
      deviceId: json["deviceId"] as? String ?? "",
      deviceVersion: json["deviceVersion"] as? String ?? "",
      friendlyName: json["friendlyName"] as? String ?? "",
      icons: icons,
      ipAddress: json["ipAddress"] as? String ?? "",
      isOnLocalNetwork: json["isOnLocalNetwork"] as? Bool,
      modelName: json["modelName"] as? String ?? ""
    )
  }

  static func applicationMetadata(from json: [String: Any]) -> ApplicationMetadata {
    return ApplicationMetadata(
      applicationId: json["applicationId"] as? String ?? "",
      images: (json["images"] as? [[String: Any]])?.map { webImage(from: $0) } ?? [],
      name: json["name"] as? String ?? "",
      namespaces: (json["namespaces"] as? [String]) ?? []
    )
  }

  static func mediaLiveSeekableRange(from json: [String: Any]) -> MediaLiveSeekableRange {
    return MediaLiveSeekableRange(
      startTime: number(json["startTime"]) ?? 0,
      endTime: number(json["endTime"]) ?? 0,
      isMovingWindow: json["isMovingWindow"] as? Bool ?? false,
      isLiveDone: json["isLiveDone"] as? Bool ?? false
    )
  }

  static func mediaStatus(from json: [String: Any]) -> MediaStatus {
    return MediaStatus(
      mediaInfo: (json["mediaInfo"] as? [String: Any]).map { mediaInfo(from: $0) },
      playerState: (json["playerState"] as? String).flatMap { MediaPlayerState(fromString: $0) },
      idleReason: (json["idleReason"] as? String).flatMap { MediaPlayerIdleReason(fromString: $0) },
      streamPosition: number(json["streamPosition"]) ?? 0,
      playbackRate: number(json["playbackRate"]) ?? 0,
      volume: number(json["volume"]) ?? 0,
      isMuted: json["isMuted"] as? Bool ?? false,
      activeTrackIds: (json["activeTrackIds"] as? [Any])?.compactMap { number($0) },
      videoInfo: (json["videoInfo"] as? [String: Any]).map { videoInfo(from: $0) },
      liveSeekableRange: (json["liveSeekableRange"] as? [String: Any]).map {
        mediaLiveSeekableRange(from: $0)
      },
      queueItems: (json["queueItems"] as? [[String: Any]])?.map { mediaQueueItem(from: $0) } ?? [],
      currentItemId: number(json["currentItemId"]),
      loadingItemId: number(json["loadingItemId"]),
      preloadedItemId: number(json["preloadedItemId"]),
      queueRepeatMode: (json["queueRepeatMode"] as? String).flatMap {
        MediaRepeatMode(fromString: $0)
      },
      customData: anyMap(json["customData"])
    )
  }

  // MARK: - Helpers

  static func number(_ value: Any?) -> Double? {
    return (value as? NSNumber)?.doubleValue
  }

  /// Builds an `AnyMap` from a JSON object (string → string, bool → bool, number → double).
  static func anyMap(_ value: Any?) -> AnyMap? {
    guard let dict = value as? [String: Any] else {
      return nil
    }
    let map = AnyMap()
    for (key, raw) in dict {
      if let string = raw as? String {
        map.setString(key: key, value: string)
      } else if let n = raw as? NSNumber {
        // CFBoolean IS an NSNumber; detect it first so fixture booleans stay booleans.
        if CFGetTypeID(n) == CFBooleanGetTypeID() {
          map.setBoolean(key: key, value: n.boolValue)
        } else {
          map.setDouble(key: key, value: n.doubleValue)
        }
      }
    }
    return map
  }
}

/// Anchors `Bundle(for:)` to the test bundle.
private final class BundleToken {}
