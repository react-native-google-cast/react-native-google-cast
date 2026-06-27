import Foundation
import NitroModules

/// Debug-only HybridObject (iOS) that exercises the per-platform struct↔GCK converters.
///
/// Not part of the public API. Each `roundTrip*` method runs the value through
/// `struct → GCK → struct` so the shared golden-fixture parity suite (T1) can assert
/// round-trip identity and cross-platform (iOS == Android) equality. Converters live in
/// one-per-type files under `Converters/`; this object only wires them together.
///
/// `PlayServicesState` has no iOS GCK counterpart (Android-only), so its round-trip is an
/// identity pass-through; every other type runs through its real struct↔GCK converters.
final class HybridCastDebug: HybridCastDebugSpec {
  func roundTripWebImage(value: WebImage) throws -> WebImage {
    value.toGckImage().toWebImage()
  }

  /// `GCKDevice` is receive-only and cannot be constructed on iOS — its `init` is
  /// `NS_UNAVAILABLE`, it blocks ivar mutation, and `deviceID` has no settable backing ivar.
  /// The GCK→struct direction (`GCKDevice+toDevice.swift`) is implemented but UNVERIFIED on iOS:
  /// no `GCKDevice` instance can be obtained in XCTest, so neither direction has runtime
  /// coverage here. Android (which constructs `Device` natively) must verify the mapping.
  func roundTripDevice(value: Device) throws -> Device {
    throw Self.notConstructibleOnIos("Device", "GCKDevice")
  }

  /// `GCKApplicationMetadata` is receive-only and cannot be constructed on iOS — its default
  /// initializer traps at runtime. The GCK→struct direction
  /// (`GCKApplicationMetadata+toApplicationMetadata.swift`) is implemented but UNVERIFIED on iOS
  /// (no instance obtainable in XCTest); Android must verify the mapping.
  func roundTripApplicationMetadata(
    value: ApplicationMetadata
  ) throws -> ApplicationMetadata {
    throw Self.notConstructibleOnIos("ApplicationMetadata", "GCKApplicationMetadata")
  }

  func roundTripMediaMetadata(value: MediaMetadata) throws -> MediaMetadata {
    value.toGckMediaMetadata().toMediaMetadata()
  }

  func roundTripMediaTrack(value: MediaTrack) throws -> MediaTrack {
    value.toGckMediaTrack().toMediaTrack()
  }

  func roundTripTextTrackStyle(value: TextTrackStyle) throws -> TextTrackStyle {
    value.toGckTextTrackStyle().toTextTrackStyle()
  }

  func roundTripVideoInfo(value: VideoInfo) throws -> VideoInfo {
    value.toGckVideoInfo().toVideoInfo()
  }

  func roundTripMediaInfo(value: MediaInfo) throws -> MediaInfo {
    value.toGckMediaInformation().toMediaInfo()
  }

  func roundTripMediaLiveSeekableRange(
    value: MediaLiveSeekableRange
  ) throws -> MediaLiveSeekableRange {
    value.toGckMediaLiveSeekableRange().toMediaLiveSeekableRange()
  }

  func roundTripMediaQueueItem(value: MediaQueueItem) throws -> MediaQueueItem {
    value.toGckMediaQueueItem().toMediaQueueItem()
  }

  func roundTripMediaQueueContainerMetadata(
    value: MediaQueueContainerMetadata
  ) throws -> MediaQueueContainerMetadata {
    value.toGckMediaQueueContainerMetadata().toMediaQueueContainerMetadata()
  }

  func roundTripMediaQueueData(value: MediaQueueData) throws -> MediaQueueData {
    value.toGckMediaQueueData().toMediaQueueData()
  }

  func roundTripMediaLoadRequest(
    value: MediaLoadRequest
  ) throws -> MediaLoadRequest {
    value.toGckMediaLoadRequestData().toMediaLoadRequest()
  }

  func roundTripMediaSeekOptions(
    value: MediaSeekOptions
  ) throws -> MediaSeekOptions {
    value.toGckMediaSeekOptions().toMediaSeekOptions()
  }

  func roundTripMediaStatus(value: MediaStatus) throws -> MediaStatus {
    value.toGckMediaStatus().toMediaStatus()
  }

  func roundTripActiveInputState(
    value: ActiveInputState
  ) throws -> ActiveInputState {
    value.toGckActiveInputStatus().toActiveInputState()
  }

  func roundTripStandbyState(value: StandbyState) throws -> StandbyState {
    value.toGckStandbyStatus().toStandbyState()
  }

  /// iOS has no Google Play Services concept, so `PlayServicesState` has no GCK counterpart;
  /// this is an Android-only type. The value passes through unchanged (no GCK conversion
  /// exists to exercise on iOS).
  func roundTripPlayServicesState(
    value: PlayServicesState
  ) throws -> PlayServicesState {
    value
  }

  /// Signals a receive-only GCK type whose iOS class cannot be constructed (so the synthetic
  /// `struct → GCK → struct` round-trip cannot run on iOS). The forward, app-used direction
  /// (`GCK<type> → struct`) is still implemented.
  private static func notConstructibleOnIos(_ type: String, _ gckType: String) -> RuntimeError {
    RuntimeError.error(
      withMessage:
        "CastDebug.roundTrip\(type): \(gckType) is receive-only on iOS and cannot be constructed; "
        + "only the \(gckType)→\(type) direction is available."
    )
  }
}
