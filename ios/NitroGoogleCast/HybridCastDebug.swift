import Foundation
import NitroModules

/// Debug-only HybridObject (iOS) that exercises the per-platform struct↔GCK converters.
///
/// Not part of the public API. Each `roundTrip*` method runs the value through
/// `struct → GCK → struct` so the shared golden-fixture parity suite (T1) can assert
/// round-trip identity and cross-platform (iOS == Android) equality. Converters live in
/// one-per-type files under `Converters/`; this object only wires them together.
///
/// Methods whose converters are not yet written throw `notImplemented(_:)` so the module
/// keeps compiling while the converter set is filled in (fan-out work).
final class HybridCastDebug: HybridCastDebugSpec {
  func roundTripWebImage(value: WebImage) throws -> WebImage {
    value.toGckImage().toWebImage()
  }

  func roundTripDevice(value: Device) throws -> Device {
    throw Self.notImplemented("Device")
  }

  func roundTripApplicationMetadata(
    value: ApplicationMetadata
  ) throws -> ApplicationMetadata {
    throw Self.notImplemented("ApplicationMetadata")
  }

  func roundTripMediaMetadata(value: MediaMetadata) throws -> MediaMetadata {
    throw Self.notImplemented("MediaMetadata")
  }

  func roundTripMediaTrack(value: MediaTrack) throws -> MediaTrack {
    throw Self.notImplemented("MediaTrack")
  }

  func roundTripTextTrackStyle(value: TextTrackStyle) throws -> TextTrackStyle {
    throw Self.notImplemented("TextTrackStyle")
  }

  func roundTripVideoInfo(value: VideoInfo) throws -> VideoInfo {
    throw Self.notImplemented("VideoInfo")
  }

  func roundTripMediaInfo(value: MediaInfo) throws -> MediaInfo {
    throw Self.notImplemented("MediaInfo")
  }

  func roundTripMediaLiveSeekableRange(
    value: MediaLiveSeekableRange
  ) throws -> MediaLiveSeekableRange {
    throw Self.notImplemented("MediaLiveSeekableRange")
  }

  func roundTripMediaQueueItem(value: MediaQueueItem) throws -> MediaQueueItem {
    throw Self.notImplemented("MediaQueueItem")
  }

  func roundTripMediaQueueContainerMetadata(
    value: MediaQueueContainerMetadata
  ) throws -> MediaQueueContainerMetadata {
    throw Self.notImplemented("MediaQueueContainerMetadata")
  }

  func roundTripMediaQueueData(value: MediaQueueData) throws -> MediaQueueData {
    throw Self.notImplemented("MediaQueueData")
  }

  func roundTripMediaLoadRequest(
    value: MediaLoadRequest
  ) throws -> MediaLoadRequest {
    throw Self.notImplemented("MediaLoadRequest")
  }

  func roundTripMediaSeekOptions(
    value: MediaSeekOptions
  ) throws -> MediaSeekOptions {
    throw Self.notImplemented("MediaSeekOptions")
  }

  func roundTripMediaStatus(value: MediaStatus) throws -> MediaStatus {
    throw Self.notImplemented("MediaStatus")
  }

  func roundTripActiveInputState(
    value: ActiveInputState
  ) throws -> ActiveInputState {
    throw Self.notImplemented("ActiveInputState")
  }

  func roundTripStandbyState(value: StandbyState) throws -> StandbyState {
    throw Self.notImplemented("StandbyState")
  }

  func roundTripPlayServicesState(
    value: PlayServicesState
  ) throws -> PlayServicesState {
    throw Self.notImplemented("PlayServicesState")
  }

  private static func notImplemented(_ type: String) -> RuntimeError {
    RuntimeError.error(
      withMessage: "CastDebug.roundTrip\(type): converter not yet implemented"
    )
  }
}
