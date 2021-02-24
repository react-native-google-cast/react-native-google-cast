#import "RNGCRemoteMediaClient.h"
#import "../types/RCTConvert+GCKMediaInformation.m"
#import "../types/RCTConvert+GCKMediaLoadRequest.m"
#import "../types/RCTConvert+GCKMediaStatus.m"
#import "../types/RCTConvert+GCKMediaTextTrackStyle.m"
#import "../types/RCTConvert+GCKRemoteMediaClient.m"
#import "RNGCRequest.h"
#import <Foundation/Foundation.h>

#if __has_include(<FBLPromises/FBLPromises.h>)
#import <FBLPromises/FBLPromises.h>
#else
#import "FBLPromises.h"
#endif

@implementation RNGCRemoteMediaClient {
  bool hasListeners;
  NSNumber *progressInterval;
  NSTimer *progressTimer;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"MEDIA_PROGRESS_UPDATED" : MEDIA_PROGRESS_UPDATED,
    @"MEDIA_STATUS_UPDATED" : MEDIA_STATUS_UPDATED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    MEDIA_PROGRESS_UPDATED,
    MEDIA_STATUS_UPDATED,
  ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager addListener:self];

    GCKRemoteMediaClient *client = [self getClient];
    if (client != nil) {
      [client addListener:self];
    }
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  if (!hasListeners) { return; }
  hasListeners = NO;
  [progressTimer invalidate];
  progressTimer = nil;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager removeListener:self];

    GCKRemoteMediaClient *client = [self getClient];
    if (client != nil) {
      [client removeListener:self];
    }
  });
}

- (void)invalidate {
  [self stopObserving];
}

# pragma mark - GCKRemoteMediaClient methods

RCT_REMAP_METHOD(getMediaStatus,
                 getMediaStatusResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientResolve:resolve reject:reject perform:^id(GCKRemoteMediaClient *client) {
    GCKMediaStatus *status = [client mediaStatus];
    return status != nil ? [RCTConvert fromGCKMediaStatus:status] : [NSNull null];
  }];
}

RCT_REMAP_METHOD(getStreamPosition,
                 getStreamPositionResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {

  [self withClientResolve:resolve reject:reject perform:^id(GCKRemoteMediaClient *client) {
    GCKMediaStatus *status = [client mediaStatus];
    if (status == nil || status.playerState == GCKMediaPlayerStateIdle || status.playerState == GCKMediaPlayerStateUnknown) {
      return [NSNull null];
    } else {
      return [NSNumber numberWithDouble:[client approximateStreamPosition]];
    }
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

RCT_EXPORT_METHOD(setProgressUpdateInterval: (nonnull NSNumber *) interval
                 resolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  if (interval == nil || interval <= 0) {
    [progressTimer invalidate];
    progressTimer = nil;
    progressInterval = nil;
  } else {
    progressInterval = interval;
  }
}

RCT_EXPORT_METHOD(setStreamMuted: (BOOL) muted
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

# pragma mark - GCKRemoteMediaClient events

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client
     didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {

  [self sendEventWithName:MEDIA_STATUS_UPDATED body:[RCTConvert fromGCKMediaStatus:mediaStatus]];

  NSTimeInterval duration = mediaStatus.mediaInformation.streamDuration;

  if (progressInterval != nil && mediaStatus != nil && mediaStatus.playerState != GCKMediaPlayerStateIdle && mediaStatus.playerState != GCKMediaPlayerStateUnknown) {
    if (progressTimer) {
      if ([progressTimer timeInterval] == progressInterval.doubleValue) return;
      [progressTimer invalidate];
    }
    progressTimer = [NSTimer
      scheduledTimerWithTimeInterval:progressInterval.doubleValue
                              target:self
                            selector:@selector(progressUpdated:)
                            userInfo:@(duration)
                             repeats:YES
    ];
  } else {
    [progressTimer invalidate];
    progressTimer = nil;
    [self sendEventWithName:MEDIA_PROGRESS_UPDATED body:@[
      [NSNull null], @(duration)
    ]];
  }
}

-(void) progressUpdated:(NSTimer*)timer {
  double progress = [self.getClient approximateStreamPosition];
  if (!progress || progress == INFINITY || progress == NAN) { return; }
  [self sendEventWithName:MEDIA_PROGRESS_UPDATED body:@[
    @(progress), timer.userInfo
  ]];
}

# pragma mark - GCKSessionManager events

- (void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
  [session.remoteMediaClient addListener:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
  [session.remoteMediaClient addListener:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager willEndCastSession:(GCKCastSession *)session {
  [session.remoteMediaClient removeListener:self];
}

# pragma mark - Helpers

- (nullable GCKRemoteMediaClient *)getClient {
  GCKSession *session =
      GCKCastContext.sharedInstance.sessionManager.currentSession;

  if (session == nil || session.remoteMediaClient == nil) { return nil; }

  return session.remoteMediaClient;
}

- (FBLPromise *)getClientPromise {
  return [FBLPromise async:^(FBLPromiseFulfillBlock _Nonnull fulfill, FBLPromiseRejectBlock _Nonnull reject) {
    GCKRemoteMediaClient *client = [self getClient];

    if (client != nil) {
      fulfill(client);
    } else {
      reject([NSError errorWithDomain:NSCocoaErrorDomain
                                 code:GCKErrorCodeNoMediaSession
                             userInfo:nil]);
    }
  }];
}

- (void)withClientResolve:(RCTPromiseResolveBlock)resolve
      reject:(RCTPromiseRejectBlock)reject
     perform:(id (^)(GCKRemoteMediaClient *client))block {
  [[[self getClientPromise] then:^id _Nullable(id _Nullable client) {
    resolve(block(client));
    return nil;
  }] catch:^(NSError * _Nonnull error) {
    reject(error.localizedDescription, error.localizedFailureReason, error);
  }];
}

- (void)withClientPromisifyResolve:(RCTPromiseResolveBlock)resolve
     reject:(RCTPromiseRejectBlock)reject
    perform:(GCKRequest * (^)(GCKRemoteMediaClient *client))block {
  [[[self getClientPromise] then:^id _Nullable(id _Nullable client) {
    GCKRequest *request = block(client);
    [RNGCRequest promisifyRequest:request resolve:resolve reject:reject];
    return nil;
  }] catch:^(NSError * _Nonnull error) {
    reject(error.localizedDescription, error.localizedFailureReason, error);
  }];
}

@end
