package com.margelo.nitro.googlecast

import androidx.annotation.Keep
import com.facebook.proguard.annotations.DoNotStrip
import com.margelo.nitro.googlecast.converters.fromGckActiveInputState
import com.margelo.nitro.googlecast.converters.fromGckConnectionResult
import com.margelo.nitro.googlecast.converters.fromGckStandbyState
import com.margelo.nitro.googlecast.converters.toApplicationMetadata
import com.margelo.nitro.googlecast.converters.toDevice
import com.margelo.nitro.googlecast.converters.toGckActiveInputState
import com.margelo.nitro.googlecast.converters.toGckApplicationMetadata
import com.margelo.nitro.googlecast.converters.toGckCastDevice
import com.margelo.nitro.googlecast.converters.toGckConnectionResult
import com.margelo.nitro.googlecast.converters.toGckMediaInfo
import com.margelo.nitro.googlecast.converters.toGckMediaLiveSeekableRange
import com.margelo.nitro.googlecast.converters.toGckMediaLoadRequestData
import com.margelo.nitro.googlecast.converters.toGckMediaMetadata
import com.margelo.nitro.googlecast.converters.toGckMediaQueueContainerMetadata
import com.margelo.nitro.googlecast.converters.toGckMediaQueueData
import com.margelo.nitro.googlecast.converters.toGckMediaQueueItem
import com.margelo.nitro.googlecast.converters.toGckMediaSeekOptions
import com.margelo.nitro.googlecast.converters.toGckMediaStatus
import com.margelo.nitro.googlecast.converters.toGckMediaTrack
import com.margelo.nitro.googlecast.converters.toGckStandbyState
import com.margelo.nitro.googlecast.converters.toGckTextTrackStyle
import com.margelo.nitro.googlecast.converters.toGckVideoInfo
import com.margelo.nitro.googlecast.converters.toGckWebImage
import com.margelo.nitro.googlecast.converters.toMediaInfo
import com.margelo.nitro.googlecast.converters.toMediaLiveSeekableRange
import com.margelo.nitro.googlecast.converters.toMediaLoadRequest
import com.margelo.nitro.googlecast.converters.toMediaMetadata
import com.margelo.nitro.googlecast.converters.toMediaQueueContainerMetadata
import com.margelo.nitro.googlecast.converters.toMediaQueueData
import com.margelo.nitro.googlecast.converters.toMediaQueueItem
import com.margelo.nitro.googlecast.converters.toMediaSeekOptions
import com.margelo.nitro.googlecast.converters.toMediaStatus
import com.margelo.nitro.googlecast.converters.toMediaTrack
import com.margelo.nitro.googlecast.converters.toTextTrackStyle
import com.margelo.nitro.googlecast.converters.toVideoInfo
import com.margelo.nitro.googlecast.converters.toWebImage

/**
 * Debug-only HybridObject (Android) that exercises the per-platform struct↔GCK converters.
 *
 * Not part of the public API. Each `roundTrip*` method runs the value through
 * `struct → GCK → struct` so the shared golden-fixture parity suite (T1) can assert
 * round-trip identity and cross-platform (iOS == Android) equality. Converters live in
 * one-per-type files under `converters/`; this object only wires them together.
 */
@DoNotStrip
@Keep
class HybridCastDebug : HybridCastDebugSpec() {
  override fun roundTripWebImage(value: WebImage): WebImage =
    value.toGckWebImage().toWebImage()

  override fun roundTripDevice(value: Device): Device =
    value.toGckCastDevice().toDevice()

  override fun roundTripApplicationMetadata(
    value: ApplicationMetadata
  ): ApplicationMetadata = value.toGckApplicationMetadata().toApplicationMetadata()

  override fun roundTripMediaMetadata(value: MediaMetadata): MediaMetadata =
    value.toGckMediaMetadata().toMediaMetadata()

  override fun roundTripMediaTrack(value: MediaTrack): MediaTrack =
    value.toGckMediaTrack().toMediaTrack()

  override fun roundTripTextTrackStyle(value: TextTrackStyle): TextTrackStyle =
    value.toGckTextTrackStyle().toTextTrackStyle()

  override fun roundTripVideoInfo(value: VideoInfo): VideoInfo =
    value.toGckVideoInfo().toVideoInfo()

  override fun roundTripMediaInfo(value: MediaInfo): MediaInfo =
    value.toGckMediaInfo().toMediaInfo()

  override fun roundTripMediaLiveSeekableRange(
    value: MediaLiveSeekableRange
  ): MediaLiveSeekableRange = value.toGckMediaLiveSeekableRange().toMediaLiveSeekableRange()

  override fun roundTripMediaQueueItem(value: MediaQueueItem): MediaQueueItem =
    value.toGckMediaQueueItem().toMediaQueueItem()

  override fun roundTripMediaQueueContainerMetadata(
    value: MediaQueueContainerMetadata
  ): MediaQueueContainerMetadata =
    value.toGckMediaQueueContainerMetadata().toMediaQueueContainerMetadata()

  override fun roundTripMediaQueueData(value: MediaQueueData): MediaQueueData =
    value.toGckMediaQueueData().toMediaQueueData()

  override fun roundTripMediaLoadRequest(
    value: MediaLoadRequest
  ): MediaLoadRequest = value.toGckMediaLoadRequestData().toMediaLoadRequest()

  override fun roundTripMediaSeekOptions(
    value: MediaSeekOptions
  ): MediaSeekOptions = value.toGckMediaSeekOptions().toMediaSeekOptions()

  override fun roundTripMediaStatus(value: MediaStatus): MediaStatus =
    value.toGckMediaStatus().toMediaStatus()

  override fun roundTripActiveInputState(
    value: ActiveInputState
  ): ActiveInputState = ActiveInputState.fromGckActiveInputState(value.toGckActiveInputState())

  override fun roundTripStandbyState(value: StandbyState): StandbyState =
    StandbyState.fromGckStandbyState(value.toGckStandbyState())

  override fun roundTripPlayServicesState(
    value: PlayServicesState
  ): PlayServicesState =
    PlayServicesState.fromGckConnectionResult(value.toGckConnectionResult())
}
