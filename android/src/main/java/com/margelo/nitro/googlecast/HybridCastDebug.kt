package com.margelo.nitro.googlecast

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.googlecast.converters.toGckWebImage
import com.margelo.nitro.googlecast.converters.toWebImage

/**
 * Debug-only HybridObject (Android) that exercises the per-platform struct↔GCK converters.
 *
 * Not part of the public API. Each `roundTrip*` method runs the value through
 * `struct → GCK → struct` so the shared golden-fixture parity suite (T1) can assert
 * round-trip identity and cross-platform (iOS == Android) equality. Converters live in
 * one-per-type files under `converters/`; this object only wires them together.
 *
 * Methods whose converters are not yet written throw so the module keeps compiling while
 * the converter set is filled in (fan-out work).
 */
@DoNotStrip
@Keep
class HybridCastDebug : HybridCastDebugSpec() {
  override fun roundTripWebImage(value: WebImage): WebImage =
    value.toGckWebImage().toWebImage()

  override fun roundTripDevice(value: Device): Device = notImplemented("Device")

  override fun roundTripApplicationMetadata(
    value: ApplicationMetadata
  ): ApplicationMetadata = notImplemented("ApplicationMetadata")

  override fun roundTripMediaMetadata(value: MediaMetadata): MediaMetadata =
    notImplemented("MediaMetadata")

  override fun roundTripMediaTrack(value: MediaTrack): MediaTrack =
    notImplemented("MediaTrack")

  override fun roundTripTextTrackStyle(value: TextTrackStyle): TextTrackStyle =
    notImplemented("TextTrackStyle")

  override fun roundTripVideoInfo(value: VideoInfo): VideoInfo =
    notImplemented("VideoInfo")

  override fun roundTripMediaInfo(value: MediaInfo): MediaInfo =
    notImplemented("MediaInfo")

  override fun roundTripMediaLiveSeekableRange(
    value: MediaLiveSeekableRange
  ): MediaLiveSeekableRange = notImplemented("MediaLiveSeekableRange")

  override fun roundTripMediaQueueItem(value: MediaQueueItem): MediaQueueItem =
    notImplemented("MediaQueueItem")

  override fun roundTripMediaQueueContainerMetadata(
    value: MediaQueueContainerMetadata
  ): MediaQueueContainerMetadata = notImplemented("MediaQueueContainerMetadata")

  override fun roundTripMediaQueueData(value: MediaQueueData): MediaQueueData =
    notImplemented("MediaQueueData")

  override fun roundTripMediaLoadRequest(
    value: MediaLoadRequest
  ): MediaLoadRequest = notImplemented("MediaLoadRequest")

  override fun roundTripMediaSeekOptions(
    value: MediaSeekOptions
  ): MediaSeekOptions = notImplemented("MediaSeekOptions")

  override fun roundTripMediaStatus(value: MediaStatus): MediaStatus =
    notImplemented("MediaStatus")

  override fun roundTripActiveInputState(
    value: ActiveInputState
  ): ActiveInputState = notImplemented("ActiveInputState")

  override fun roundTripStandbyState(value: StandbyState): StandbyState =
    notImplemented("StandbyState")

  override fun roundTripPlayServicesState(
    value: PlayServicesState
  ): PlayServicesState = notImplemented("PlayServicesState")

  private fun notImplemented(type: String): Nothing =
    throw UnsupportedOperationException(
      "CastDebug.roundTrip$type: converter not yet implemented"
    )
}
