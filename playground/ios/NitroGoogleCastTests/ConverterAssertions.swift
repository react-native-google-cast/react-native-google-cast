import NitroModules
import XCTest

@testable import NitroGoogleCast

/// Shared deep-equality assertions for the converter parity suite. Composite types
/// (`MediaInfo`, `MediaQueueItem`, …) reuse the leaf assertions so each test file stays thin.
/// Every assertion compares a round-tripped struct against the corpus `expectedRoundTrip`.
enum ConverterAssertions {
  // MARK: - AnyMap

  static func assertEqual(
    _ actual: AnyMap?, _ expected: AnyMap?, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    if actual == nil && expected == nil { return }
    guard let actual, let expected else {
      XCTFail("\(ctx) customData presence mismatch (actual=\(actual != nil))", file: file, line: line)
      return
    }
    let actualKeys = Set(actual.getAllKeys())
    let expectedKeys = Set(expected.getAllKeys())
    XCTAssertEqual(actualKeys, expectedKeys, "\(ctx) customData keys", file: file, line: line)
    for key in expectedKeys.intersection(actualKeys) {
      if expected.isString(key: key) {
        XCTAssertEqual(
          actual.getString(key: key), expected.getString(key: key),
          "\(ctx) customData[\(key)]", file: file, line: line)
      } else if expected.isBool(key: key) {
        // Assert the type tag first: a bool that collapsed to 1.0/0.0 (#617) must fail
        // with a clear message instead of trapping inside getBoolean on a double value.
        XCTAssertTrue(
          actual.isBool(key: key),
          "\(ctx) customData[\(key)] should be Bool", file: file, line: line)
        if actual.isBool(key: key) {
          XCTAssertEqual(
            actual.getBoolean(key: key), expected.getBoolean(key: key),
            "\(ctx) customData[\(key)]", file: file, line: line)
        }
      } else if expected.isDouble(key: key) {
        XCTAssertEqual(
          actual.getDouble(key: key), expected.getDouble(key: key), accuracy: 1e-9,
          "\(ctx) customData[\(key)]", file: file, line: line)
      }
    }
  }

  // MARK: - WebImage

  static func assertEqual(
    _ actual: WebImage, _ expected: WebImage, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.url, expected.url, "\(ctx).url", file: file, line: line)
    XCTAssertEqual(actual.width, expected.width, "\(ctx).width", file: file, line: line)
    XCTAssertEqual(actual.height, expected.height, "\(ctx).height", file: file, line: line)
  }

  static func assertEqual(
    _ actual: [WebImage]?, _ expected: [WebImage]?, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual?.count, expected?.count, "\(ctx).count", file: file, line: line)
    guard let actual, let expected, actual.count == expected.count else { return }
    for (i, pair) in zip(actual, expected).enumerated() {
      assertEqual(pair.0, pair.1, "\(ctx)[\(i)]", file: file, line: line)
    }
  }

  // MARK: - MediaMetadata

  static func assertEqual(
    _ actual: MediaMetadata, _ expected: MediaMetadata, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.type.stringValue, expected.type.stringValue, "\(ctx).type", file: file, line: line)
    XCTAssertEqual(actual.title, expected.title, "\(ctx).title", file: file, line: line)
    XCTAssertEqual(actual.subtitle, expected.subtitle, "\(ctx).subtitle", file: file, line: line)
    XCTAssertEqual(actual.artist, expected.artist, "\(ctx).artist", file: file, line: line)
    XCTAssertEqual(
      actual.releaseDate, expected.releaseDate, "\(ctx).releaseDate", file: file, line: line)
    XCTAssertEqual(actual.studio, expected.studio, "\(ctx).studio", file: file, line: line)
    XCTAssertEqual(
      actual.albumTitle, expected.albumTitle, "\(ctx).albumTitle", file: file, line: line)
    XCTAssertEqual(
      actual.albumArtist, expected.albumArtist, "\(ctx).albumArtist", file: file, line: line)
    XCTAssertEqual(actual.composer, expected.composer, "\(ctx).composer", file: file, line: line)
    XCTAssertEqual(
      actual.discNumber, expected.discNumber, "\(ctx).discNumber", file: file, line: line)
    XCTAssertEqual(
      actual.trackNumber, expected.trackNumber, "\(ctx).trackNumber", file: file, line: line)
    XCTAssertEqual(
      actual.creationDate, expected.creationDate, "\(ctx).creationDate", file: file, line: line)
    XCTAssertEqual(actual.location, expected.location, "\(ctx).location", file: file, line: line)
    XCTAssertEqual(actual.latitude, expected.latitude, "\(ctx).latitude", file: file, line: line)
    XCTAssertEqual(
      actual.longitude, expected.longitude, "\(ctx).longitude", file: file, line: line)
    XCTAssertEqual(actual.width, expected.width, "\(ctx).width", file: file, line: line)
    XCTAssertEqual(actual.height, expected.height, "\(ctx).height", file: file, line: line)
    XCTAssertEqual(
      actual.broadcastDate, expected.broadcastDate, "\(ctx).broadcastDate", file: file, line: line)
    XCTAssertEqual(
      actual.episodeNumber, expected.episodeNumber, "\(ctx).episodeNumber", file: file, line: line)
    XCTAssertEqual(
      actual.seasonNumber, expected.seasonNumber, "\(ctx).seasonNumber", file: file, line: line)
    XCTAssertEqual(
      actual.seriesTitle, expected.seriesTitle, "\(ctx).seriesTitle", file: file, line: line)
    assertEqual(actual.images, expected.images, "\(ctx).images", file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  static func assertEqual(
    _ actual: [MediaMetadata]?, _ expected: [MediaMetadata]?, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual?.count, expected?.count, "\(ctx).count", file: file, line: line)
    guard let actual, let expected, actual.count == expected.count else { return }
    for (i, pair) in zip(actual, expected).enumerated() {
      assertEqual(pair.0, pair.1, "\(ctx)[\(i)]", file: file, line: line)
    }
  }

  // MARK: - MediaTrack

  static func assertEqual(
    _ actual: MediaTrack, _ expected: MediaTrack, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.id, expected.id, "\(ctx).id", file: file, line: line)
    XCTAssertEqual(
      actual.type.stringValue, expected.type.stringValue, "\(ctx).type", file: file, line: line)
    XCTAssertEqual(actual.contentId, expected.contentId, "\(ctx).contentId", file: file, line: line)
    XCTAssertEqual(
      actual.contentType, expected.contentType, "\(ctx).contentType", file: file, line: line)
    XCTAssertEqual(actual.language, expected.language, "\(ctx).language", file: file, line: line)
    XCTAssertEqual(actual.name, expected.name, "\(ctx).name", file: file, line: line)
    XCTAssertEqual(
      actual.subtype?.stringValue, expected.subtype?.stringValue, "\(ctx).subtype",
      file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  static func assertEqual(
    _ actual: [MediaTrack]?, _ expected: [MediaTrack]?, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual?.count, expected?.count, "\(ctx).count", file: file, line: line)
    guard let actual, let expected, actual.count == expected.count else { return }
    for (i, pair) in zip(actual, expected).enumerated() {
      assertEqual(pair.0, pair.1, "\(ctx)[\(i)]", file: file, line: line)
    }
  }

  // MARK: - TextTrackStyle

  static func assertEqual(
    _ actual: TextTrackStyle, _ expected: TextTrackStyle, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.backgroundColor, expected.backgroundColor, "\(ctx).backgroundColor",
      file: file, line: line)
    XCTAssertEqual(
      actual.edgeColor, expected.edgeColor, "\(ctx).edgeColor", file: file, line: line)
    XCTAssertEqual(
      actual.edgeType?.stringValue, expected.edgeType?.stringValue, "\(ctx).edgeType",
      file: file, line: line)
    XCTAssertEqual(
      actual.fontFamily, expected.fontFamily, "\(ctx).fontFamily", file: file, line: line)
    XCTAssertEqual(
      actual.fontGenericFamily?.stringValue, expected.fontGenericFamily?.stringValue,
      "\(ctx).fontGenericFamily", file: file, line: line)
    XCTAssertEqual(actual.fontScale, expected.fontScale, "\(ctx).fontScale", file: file, line: line)
    XCTAssertEqual(
      actual.fontStyle?.stringValue, expected.fontStyle?.stringValue, "\(ctx).fontStyle",
      file: file, line: line)
    XCTAssertEqual(
      actual.foregroundColor, expected.foregroundColor, "\(ctx).foregroundColor",
      file: file, line: line)
    XCTAssertEqual(
      actual.windowColor, expected.windowColor, "\(ctx).windowColor", file: file, line: line)
    XCTAssertEqual(
      actual.windowCornerRadius, expected.windowCornerRadius, "\(ctx).windowCornerRadius",
      file: file, line: line)
    XCTAssertEqual(
      actual.windowType?.stringValue, expected.windowType?.stringValue, "\(ctx).windowType",
      file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  // MARK: - VideoInfo

  static func assertEqual(
    _ actual: VideoInfo, _ expected: VideoInfo, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.hdrType?.stringValue, expected.hdrType?.stringValue, "\(ctx).hdrType",
      file: file, line: line)
    XCTAssertEqual(actual.width, expected.width, "\(ctx).width", file: file, line: line)
    XCTAssertEqual(actual.height, expected.height, "\(ctx).height", file: file, line: line)
  }

  // MARK: - MediaInfo

  static func assertEqual(
    _ actual: MediaInfo, _ expected: MediaInfo, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.contentUrl, expected.contentUrl, "\(ctx).contentUrl", file: file, line: line)
    XCTAssertEqual(actual.contentId, expected.contentId, "\(ctx).contentId", file: file, line: line)
    XCTAssertEqual(
      actual.contentType, expected.contentType, "\(ctx).contentType", file: file, line: line)
    XCTAssertEqual(actual.entity, expected.entity, "\(ctx).entity", file: file, line: line)
    XCTAssertEqual(
      actual.streamType?.stringValue, expected.streamType?.stringValue, "\(ctx).streamType",
      file: file, line: line)
    XCTAssertEqual(
      actual.streamDuration, expected.streamDuration, "\(ctx).streamDuration",
      file: file, line: line)
    XCTAssertEqual(
      actual.hlsSegmentFormat?.stringValue, expected.hlsSegmentFormat?.stringValue,
      "\(ctx).hlsSegmentFormat", file: file, line: line)
    XCTAssertEqual(
      actual.hlsVideoSegmentFormat?.stringValue, expected.hlsVideoSegmentFormat?.stringValue,
      "\(ctx).hlsVideoSegmentFormat", file: file, line: line)
    if let a = actual.metadata, let e = expected.metadata {
      assertEqual(a, e, "\(ctx).metadata", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.metadata == nil, expected.metadata == nil, "\(ctx).metadata presence",
        file: file, line: line)
    }
    if let a = actual.textTrackStyle, let e = expected.textTrackStyle {
      assertEqual(a, e, "\(ctx).textTrackStyle", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.textTrackStyle == nil, expected.textTrackStyle == nil,
        "\(ctx).textTrackStyle presence", file: file, line: line)
    }
    assertEqual(actual.mediaTracks, expected.mediaTracks, "\(ctx).mediaTracks", file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  // MARK: - MediaQueueItem

  static func assertEqual(
    _ actual: MediaQueueItem, _ expected: MediaQueueItem, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    assertEqual(actual.mediaInfo, expected.mediaInfo, "\(ctx).mediaInfo", file: file, line: line)
    XCTAssertEqual(actual.itemId, expected.itemId, "\(ctx).itemId", file: file, line: line)
    XCTAssertEqual(
      actual.activeTrackIds ?? [], expected.activeTrackIds ?? [], "\(ctx).activeTrackIds",
      file: file, line: line)
    XCTAssertEqual(actual.autoplay, expected.autoplay, "\(ctx).autoplay", file: file, line: line)
    XCTAssertEqual(
      actual.playbackDuration, expected.playbackDuration, "\(ctx).playbackDuration",
      file: file, line: line)
    XCTAssertEqual(
      actual.preloadTime, expected.preloadTime, "\(ctx).preloadTime", file: file, line: line)
    XCTAssertEqual(actual.startTime, expected.startTime, "\(ctx).startTime", file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  static func assertEqual(
    _ actual: [MediaQueueItem]?, _ expected: [MediaQueueItem]?, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual?.count, expected?.count, "\(ctx).count", file: file, line: line)
    guard let actual, let expected, actual.count == expected.count else { return }
    for (i, pair) in zip(actual, expected).enumerated() {
      assertEqual(pair.0, pair.1, "\(ctx)[\(i)]", file: file, line: line)
    }
  }

  // MARK: - MediaQueueContainerMetadata

  static func assertEqual(
    _ actual: MediaQueueContainerMetadata, _ expected: MediaQueueContainerMetadata, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.containerType?.stringValue, expected.containerType?.stringValue,
      "\(ctx).containerType", file: file, line: line)
    XCTAssertEqual(actual.title, expected.title, "\(ctx).title", file: file, line: line)
    XCTAssertEqual(
      actual.containerDuration, expected.containerDuration, "\(ctx).containerDuration",
      file: file, line: line)
    assertEqual(
      actual.containerImages, expected.containerImages, "\(ctx).containerImages",
      file: file, line: line)
    assertEqual(actual.sections, expected.sections, "\(ctx).sections", file: file, line: line)
  }

  // MARK: - MediaQueueData

  static func assertEqual(
    _ actual: MediaQueueData, _ expected: MediaQueueData, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.id, expected.id, "\(ctx).id", file: file, line: line)
    XCTAssertEqual(actual.name, expected.name, "\(ctx).name", file: file, line: line)
    XCTAssertEqual(actual.entity, expected.entity, "\(ctx).entity", file: file, line: line)
    XCTAssertEqual(
      actual.type?.stringValue, expected.type?.stringValue, "\(ctx).type", file: file, line: line)
    XCTAssertEqual(
      actual.repeatMode?.stringValue, expected.repeatMode?.stringValue, "\(ctx).repeatMode",
      file: file, line: line)
    XCTAssertEqual(
      actual.startIndex, expected.startIndex, "\(ctx).startIndex", file: file, line: line)
    XCTAssertEqual(actual.startTime, expected.startTime, "\(ctx).startTime", file: file, line: line)
    if let a = actual.containerMetadata, let e = expected.containerMetadata {
      assertEqual(a, e, "\(ctx).containerMetadata", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.containerMetadata == nil, expected.containerMetadata == nil,
        "\(ctx).containerMetadata presence", file: file, line: line)
    }
    assertEqual(actual.items, expected.items, "\(ctx).items", file: file, line: line)
  }

  // MARK: - MediaLoadRequest

  static func assertEqual(
    _ actual: MediaLoadRequest, _ expected: MediaLoadRequest, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.autoplay, expected.autoplay, "\(ctx).autoplay", file: file, line: line)
    XCTAssertEqual(actual.startTime, expected.startTime, "\(ctx).startTime", file: file, line: line)
    XCTAssertEqual(
      actual.playbackRate, expected.playbackRate, "\(ctx).playbackRate", file: file, line: line)
    XCTAssertEqual(
      actual.credentials, expected.credentials, "\(ctx).credentials", file: file, line: line)
    XCTAssertEqual(
      actual.credentialsType, expected.credentialsType, "\(ctx).credentialsType",
      file: file, line: line)
    if let a = actual.mediaInfo, let e = expected.mediaInfo {
      assertEqual(a, e, "\(ctx).mediaInfo", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.mediaInfo == nil, expected.mediaInfo == nil, "\(ctx).mediaInfo presence",
        file: file, line: line)
    }
    if let a = actual.queueData, let e = expected.queueData {
      assertEqual(a, e, "\(ctx).queueData", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.queueData == nil, expected.queueData == nil, "\(ctx).queueData presence",
        file: file, line: line)
    }
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  // MARK: - MediaSeekOptions

  static func assertEqual(
    _ actual: MediaSeekOptions, _ expected: MediaSeekOptions, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.position, expected.position, "\(ctx).position", file: file, line: line)
    XCTAssertEqual(actual.relative, expected.relative, "\(ctx).relative", file: file, line: line)
    XCTAssertEqual(actual.infinite, expected.infinite, "\(ctx).infinite", file: file, line: line)
    XCTAssertEqual(
      actual.resumeState?.stringValue, expected.resumeState?.stringValue, "\(ctx).resumeState",
      file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }

  // MARK: - Device

  static func assertEqual(
    _ actual: Device, _ expected: Device, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.capabilities.map { $0.stringValue }, expected.capabilities.map { $0.stringValue },
      "\(ctx).capabilities", file: file, line: line)
    XCTAssertEqual(actual.deviceId, expected.deviceId, "\(ctx).deviceId", file: file, line: line)
    XCTAssertEqual(
      actual.deviceVersion, expected.deviceVersion, "\(ctx).deviceVersion", file: file, line: line)
    XCTAssertEqual(
      actual.friendlyName, expected.friendlyName, "\(ctx).friendlyName", file: file, line: line)
    XCTAssertEqual(actual.ipAddress, expected.ipAddress, "\(ctx).ipAddress", file: file, line: line)
    XCTAssertEqual(
      actual.isOnLocalNetwork, expected.isOnLocalNetwork, "\(ctx).isOnLocalNetwork",
      file: file, line: line)
    XCTAssertEqual(actual.modelName, expected.modelName, "\(ctx).modelName", file: file, line: line)
    assertEqual(actual.icons, expected.icons, "\(ctx).icons", file: file, line: line)
  }

  // MARK: - ApplicationMetadata

  static func assertEqual(
    _ actual: ApplicationMetadata, _ expected: ApplicationMetadata, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.applicationId, expected.applicationId, "\(ctx).applicationId", file: file, line: line)
    XCTAssertEqual(actual.name, expected.name, "\(ctx).name", file: file, line: line)
    XCTAssertEqual(
      actual.namespaces, expected.namespaces, "\(ctx).namespaces", file: file, line: line)
    assertEqual(actual.images, expected.images, "\(ctx).images", file: file, line: line)
  }

  // MARK: - MediaLiveSeekableRange

  static func assertEqual(
    _ actual: MediaLiveSeekableRange, _ expected: MediaLiveSeekableRange, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(actual.startTime, expected.startTime, "\(ctx).startTime", file: file, line: line)
    XCTAssertEqual(actual.endTime, expected.endTime, "\(ctx).endTime", file: file, line: line)
    XCTAssertEqual(
      actual.isMovingWindow, expected.isMovingWindow, "\(ctx).isMovingWindow",
      file: file, line: line)
    XCTAssertEqual(
      actual.isLiveDone, expected.isLiveDone, "\(ctx).isLiveDone", file: file, line: line)
  }

  // MARK: - MediaStatus

  static func assertEqual(
    _ actual: MediaStatus, _ expected: MediaStatus, _ ctx: String,
    file: StaticString = #filePath, line: UInt = #line
  ) {
    XCTAssertEqual(
      actual.playerState?.stringValue, expected.playerState?.stringValue, "\(ctx).playerState",
      file: file, line: line)
    XCTAssertEqual(
      actual.idleReason?.stringValue, expected.idleReason?.stringValue, "\(ctx).idleReason",
      file: file, line: line)
    XCTAssertEqual(
      actual.streamPosition, expected.streamPosition, "\(ctx).streamPosition",
      file: file, line: line)
    XCTAssertEqual(
      actual.playbackRate, expected.playbackRate, accuracy: 1e-6, "\(ctx).playbackRate",
      file: file, line: line)
    XCTAssertEqual(
      actual.volume, expected.volume, accuracy: 1e-6, "\(ctx).volume", file: file, line: line)
    XCTAssertEqual(actual.isMuted, expected.isMuted, "\(ctx).isMuted", file: file, line: line)
    XCTAssertEqual(
      actual.activeTrackIds ?? [], expected.activeTrackIds ?? [], "\(ctx).activeTrackIds",
      file: file, line: line)
    XCTAssertEqual(
      actual.currentItemId, expected.currentItemId, "\(ctx).currentItemId", file: file, line: line)
    XCTAssertEqual(
      actual.loadingItemId, expected.loadingItemId, "\(ctx).loadingItemId", file: file, line: line)
    XCTAssertEqual(
      actual.preloadedItemId, expected.preloadedItemId, "\(ctx).preloadedItemId",
      file: file, line: line)
    XCTAssertEqual(
      actual.queueRepeatMode?.stringValue, expected.queueRepeatMode?.stringValue,
      "\(ctx).queueRepeatMode", file: file, line: line)
    if let a = actual.mediaInfo, let e = expected.mediaInfo {
      assertEqual(a, e, "\(ctx).mediaInfo", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.mediaInfo == nil, expected.mediaInfo == nil, "\(ctx).mediaInfo presence",
        file: file, line: line)
    }
    if let a = actual.videoInfo, let e = expected.videoInfo {
      assertEqual(a, e, "\(ctx).videoInfo", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.videoInfo == nil, expected.videoInfo == nil, "\(ctx).videoInfo presence",
        file: file, line: line)
    }
    if let a = actual.liveSeekableRange, let e = expected.liveSeekableRange {
      assertEqual(a, e, "\(ctx).liveSeekableRange", file: file, line: line)
    } else {
      XCTAssertEqual(
        actual.liveSeekableRange == nil, expected.liveSeekableRange == nil,
        "\(ctx).liveSeekableRange presence", file: file, line: line)
    }
    assertEqual(actual.queueItems, expected.queueItems, "\(ctx).queueItems", file: file, line: line)
    assertEqual(actual.customData, expected.customData, ctx, file: file, line: line)
  }
}
