#import "RNGCRemoteMediaClient.h"
#import "../types/RCTConvert+GCKMediaInformation.m"
#import "../types/RCTConvert+GCKMediaLoadRequest.m"
#import "../types/RCTConvert+GCKMediaStatus.m"
#import "../types/RCTConvert+GCKMediaTextTrackStyle.m"
#import "../types/RCTConvert+GCKRemoteMediaClient.m"
#import "RNGCRequest.h"
#import <Foundation/Foundation.h>
#import <PromisesObjC/FBLPromises.h>

@implementation RNGCRemoteMediaClient {
  NSMutableDictionary *channels;
  NSUInteger currentItemID;
  bool hasListeners;
  bool playbackStarted;
  bool playbackEnded;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"MEDIA_STATUS_UPDATED" : MEDIA_STATUS_UPDATED,
    @"MEDIA_PLAYBACK_STARTED" : MEDIA_PLAYBACK_STARTED,
    @"MEDIA_PLAYBACK_ENDED" : MEDIA_PLAYBACK_ENDED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    MEDIA_STATUS_UPDATED,
    MEDIA_PLAYBACK_STARTED,
    MEDIA_PLAYBACK_ENDED,
  ];
}

- (instancetype)init {
  if (self = [super init]) {
    channels = [[NSMutableDictionary alloc] init];
  }
  return self;
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  hasListeners = NO;
}

- (FBLPromise *)getClient {
  return [FBLPromise async:^(FBLPromiseFulfillBlock _Nonnull fulfill, FBLPromiseRejectBlock _Nonnull reject) {
    GCKSession *session =
        GCKCastContext.sharedInstance.sessionManager.currentSession;

    if (session && session.remoteMediaClient) {
      fulfill(session.remoteMediaClient);
    } else {
      NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain
                                           code:GCKErrorCodeNoMediaSession
                                       userInfo:nil];
      reject(error);
    }
  }];
}

- (void)withClientResolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
     perform:(GCKRequest * (^)(GCKRemoteMediaClient *client))block {
  [[[self getClient] then:^id _Nullable(id _Nullable client) {
    resolve(block(client));
    return nil;
  }] catch:^(NSError * _Nonnull error) {
    reject(error.localizedDescription, error.localizedFailureReason, error);
  }];
}

- (void)withClientPromisifyResolve:(RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject
    perform:(GCKRequest * (^)(GCKRemoteMediaClient *client))block {
  [[[self getClient] then:^id _Nullable(id _Nullable client) {
    GCKRequest *request = block(client);
    [RNGCRequest promisifyRequest:request resolve:resolve reject:reject];
    return nil;
  }] catch:^(NSError * _Nonnull error) {
    reject(error.localizedDescription, error.localizedFailureReason, error);
  }];
}

RCT_REMAP_METHOD(getMediaStatus,
                 getMediaStatusResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    GCKMediaStatus *status = [client mediaStatus];
    return status != nil ? [RCTConvert fromGCKMediaStatus:status] : [NSNull null];
  }];
}


RCT_EXPORT_METHOD(loadMedia: (GCKMediaLoadRequestData *) request
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client loadMediaWithLoadRequestData:request];
  }];
}

RCT_EXPORT_METHOD(play: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client playWithCustomData:customData];
  }];
}

RCT_EXPORT_METHOD(pause: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client pauseWithCustomData:customData];
  }];
}

RCT_EXPORT_METHOD(queueInsertAndPlayItem: (GCKMediaQueueItem *) item
                  beforeItemId: (NSUInteger) beforeItemId
                  playPosition: (NSTimeInterval) playPosition
                  customData: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  if (beforeItemId == 0) beforeItemId = kGCKMediaQueueInvalidItemID;
  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client queueInsertAndPlayItem:item beforeItemWithID:beforeItemId playPosition:playPosition customData:customData];
  }];
}

RCT_EXPORT_METHOD(queueInsertItems: (NSArray<GCKMediaQueueItem *> *) items
                  beforeItemId: (NSUInteger) beforeItemId
                  customData: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  if (beforeItemId == 0) beforeItemId = kGCKMediaQueueInvalidItemID;
  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client queueInsertItems:items beforeItemWithID:beforeItemId customData:customData];
  }];
}

RCT_EXPORT_METHOD(queueNext: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client queueNextItem];
  }];
}

RCT_EXPORT_METHOD(queuePrev: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client queuePreviousItem];
  }];
}

RCT_EXPORT_METHOD(seek: (GCKMediaSeekOptions *) options
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client seekWithOptions:options];
  }];
}

RCT_EXPORT_METHOD(setActiveTrackIds: (NSArray<NSNumber *> *) trackIds
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client setActiveTrackIDs:trackIds];
  }];
}

RCT_EXPORT_METHOD(setPlaybackRate: (float) playbackRate
                  customData: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client setPlaybackRate:playbackRate customData:customData];
  }];
}

RCT_EXPORT_METHOD(setStreamMuted: (bool) muted
                  customData: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client setStreamMuted:muted customData:customData];
  }];
}

RCT_EXPORT_METHOD(setStreamVolume: (float) volume
                  customData: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client setStreamVolume:volume customData:customData];
  }];
}

RCT_EXPORT_METHOD(setTextTrackStyle: (GCKMediaTextTrackStyle *) textTrackStyle
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client setTextTrackStyle:textTrackStyle];
  }];
}

RCT_EXPORT_METHOD(stop: (nullable NSDictionary *) customData
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientPromisifyResolve:resolve reject:reject perform:^GCKRequest *(GCKRemoteMediaClient *client) {
    return [client stopWithCustomData:customData];
  }];
}

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client
     didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {
  if (currentItemID != mediaStatus.currentItemID) {
    // reset item status
    currentItemID = mediaStatus.currentItemID;
    playbackStarted = false;
    playbackEnded = false;
  }

  NSDictionary *status = [RCTConvert fromGCKMediaStatus:mediaStatus];

  [self sendEventWithName:MEDIA_STATUS_UPDATED body:@{@"mediaStatus" : status}];

  if (!playbackStarted &&
      mediaStatus.playerState == GCKMediaPlayerStatePlaying) {
    [self sendEventWithName:MEDIA_PLAYBACK_STARTED
                       body:@{@"mediaStatus" : status}];
    playbackStarted = true;
  }

  if (!playbackEnded &&
      mediaStatus.idleReason == GCKMediaPlayerIdleReasonFinished) {
    [self sendEventWithName:MEDIA_PLAYBACK_ENDED
                       body:@{@"mediaStatus" : status}];
    playbackEnded = true;
  }
}

@end
