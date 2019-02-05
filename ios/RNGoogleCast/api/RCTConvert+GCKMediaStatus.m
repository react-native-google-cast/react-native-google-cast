#import "RCTConvert+GCKMediaPlayerIdleReason.m"
#import "RCTConvert+GCKMediaPlayerState.m"
#import "RCTConvert+GCKMediaInformation.m"
#import "RCTConvert+GCKMediaRepeatMode.m"
#import "RCTConvert+GCKMediaQueueItem.m"
#import "RCTConvert+GCKVideoInfo.m"
#import "RCTConvert+GCKAdBreakStatus.m"
#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaStatus)

+ (id)fromGCKMediaStatus:(GCKMediaStatus *)status {
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"mediaSessionId"] = @(status.mediaSessionID);
  json[@"playerState"] =
  [RCTConvert fromGCKMediaPlayerState:status.playerState];
  json[@"idleReason"] =
  [RCTConvert fromGCKMediaPlayerIdleReason:status.idleReason];
  json[@"playbackRate"] = @(status.playbackRate);
  json[@"mediaInfo"] =
      [RCTConvert fromGCKMediaInformation:status.mediaInformation];
  json[@"streamPosition"] = @(status.streamPosition);
  json[@"volume"] = @(status.volume);
  json[@"isMuted"] = @(status.isMuted);
  json[@"queueRepeatMode"] = [RCTConvert fromGCKMediaRepeatMode:status.queueRepeatMode];
  json[@"currentItemId"] = @(status.currentItemID);
  json[@"queueHasCurrentItem"] = @(status.queueHasCurrentItem);
  json[@"currentQueueItem"] = [RCTConvert fromGCKMediaQueueItem:status.currentQueueItem];
  json[@"queueHasNextItem"] = @(status.queueHasNextItem);
  json[@"nextQueueItem"] = [RCTConvert fromGCKMediaQueueItem:status.nextQueueItem];
  json[@"queueHasPreviousItem"] = @(status.queueHasPreviousItem);
  json[@"queueHasLoadingItem"] = @(status.queueHasLoadingItem);
  json[@"preloadedItemId"] = @(status.preloadedItemID);
  json[@"loadingItemId"] = @(status.loadingItemID);
  json[@"activeTrackIds"] = status.activeTrackIDs;
  json[@"videoInfo"] = [RCTConvert fromGCKVideoInfo:status.videoInfo];
  json[@"customData"] = status.customData;
  json[@"adBreakStatus"] = [RCTConvert fromGCKAdBreakStatus: status.adBreakStatus];
  json[@"queueItemCount"] = @(status.queueItemCount);

  return json;
}

@end
