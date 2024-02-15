#import "RCTConvert+GCKMediaStatus.h"

#import "RCTConvert+GCKMediaPlayerIdleReason.h"
#import "RCTConvert+GCKMediaPlayerState.h"
#import "RCTConvert+GCKMediaInformation.h"
#import "RCTConvert+GCKMediaRepeatMode.h"
#import "RCTConvert+GCKMediaQueueItem.h"
#import "RCTConvert+GCKVideoInfo.h"
#import "RCTConvert+GCKAdBreakStatus.h"
#import "RCTConvert+GCKMediaLiveSeekableRange.h"

@implementation RCTConvert (GCKMediaStatus)

+ (nonnull id)fromGCKMediaStatus:(nullable GCKMediaStatus *)status {
  if (status == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"activeTrackIds"] = status.activeTrackIDs;

//  json[@"adBreakStatus"] = [RCTConvert fromGCKAdBreakStatus: status.adBreakStatus];

  json[@"currentItemId"] = @(status.currentItemID);
  
//  json[@"currentQueueItem"] = [RCTConvert fromGCKMediaQueueItem:status.currentQueueItem];
  
  json[@"customData"] = status.customData ?: [NSNull null];

  json[@"idleReason"] =
  [RCTConvert fromGCKMediaPlayerIdleReason:status.idleReason];

  json[@"isMuted"] = @(status.isMuted);

  json[@"liveSeekableRange"] =
  [RCTConvert fromGCKMediaLiveSeekableRange:status.liveSeekableRange];

  json[@"loadingItemId"] = @(status.loadingItemID);

  json[@"mediaInfo"] =
  [RCTConvert fromGCKMediaInformation:status.mediaInformation];
  
//  json[@"mediaSessionId"] = @(status.mediaSessionID);

//  json[@"nextQueueItem"] = [RCTConvert fromGCKMediaQueueItem:status.nextQueueItem];

  json[@"playbackRate"] = @(status.playbackRate);

  json[@"playerState"] =
  [RCTConvert fromGCKMediaPlayerState:status.playerState];

  json[@"preloadedItemId"] = @(status.preloadedItemID);

//  json[@"queueHasCurrentItem"] = @(status.queueHasCurrentItem);
//
//  json[@"queueHasLoadingItem"] = @(status.queueHasLoadingItem);
//
//  json[@"queueHasNextItem"] = @(status.queueHasNextItem);
//
//  json[@"queueHasPreviousItem"] = @(status.queueHasPreviousItem);
//
//  json[@"queueItemCount"] = @(status.queueItemCount);
  
  NSMutableArray<id> *queueItems = [[NSMutableArray alloc] init];
  for (int i = 0; i < status.queueItemCount; i++) {
    [queueItems addObject:[RCTConvert fromGCKMediaQueueItem:[status queueItemAtIndex:i]]];
  }
  json[@"queueItems"] = queueItems;

  json[@"queueRepeatMode"] = [RCTConvert fromGCKMediaRepeatMode:status.queueRepeatMode];

  json[@"streamPosition"] = @(status.streamPosition);
  
  json[@"videoInfo"] = [RCTConvert fromGCKVideoInfo:status.videoInfo];

  json[@"volume"] = @(status.volume);

  return json;
}

@end
