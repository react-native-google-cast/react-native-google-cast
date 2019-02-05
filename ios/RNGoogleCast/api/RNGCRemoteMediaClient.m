#import "RNGCRemoteMediaClient.h"
#import "RCTConvert+GCKMediaInformation.m"
#import "RCTConvert+GCKMediaLoadOptions.m"
#import "RCTConvert+GCKMediaStatus.m"
#import "RNGCRequest.h"
#import <Foundation/Foundation.h>

@implementation RNGCRemoteMediaClient {
  NSUInteger currentItemID;
  bool hasListeners;
  bool playbackStarted;
  bool playbackEnded;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents {
  return @[
    MEDIA_STATUS_UPDATED,
    MEDIA_PLAYBACK_STARTED,
    MEDIA_PLAYBACK_ENDED,
  ];
}

- (void)getClientElseReject:(RCTPromiseRejectBlock)reject {
}

- (void)withClientResolve:(RCTPromiseResolveBlock)resolve
                   reject:(RCTPromiseRejectBlock)reject
                  perform:
                      (GCKRequest * (^)(GCKRemoteMediaClient *client))block {
  GCKSession *session =
      GCKCastContext.sharedInstance.sessionManager.currentSession;

  if (!session || !session.remoteMediaClient) {
    NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain
                                         code:GCKErrorCodeNoMediaSession
                                     userInfo:nil];
    reject(@"no_session", @"No castSession!", error);
    return;
  }

  GCKRequest *request = block(session.remoteMediaClient);
  [RNGCRequest promisifyRequest:request resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(loadMedia
                  : (NSDictionary *)media withOptions
                  : (NSDictionary *)options resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  GCKMediaInformation *mediaInfo = [RCTConvert GCKMediaInformation:media];
  GCKMediaLoadOptions *loadOptions = [RCTConvert GCKMediaLoadOptions:options];

  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client loadMedia:mediaInfo withOptions:loadOptions];
                  }];
}

RCT_EXPORT_METHOD(play
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client playWithCustomData:customData];
                  }];
}

RCT_EXPORT_METHOD(pause
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client pauseWithCustomData:customData];
                  }];
}

RCT_EXPORT_METHOD(stop
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client stopWithCustomData:customData];
                  }];
}

RCT_EXPORT_METHOD(seek
                  : (GCKMediaSeekOptions *)options resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client seekWithOptions:options];
                  }];
}

RCT_EXPORT_METHOD(setPlaybackRate
                  : (float)playbackRate customData
                  : (NSDictionary *)customData
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  [self withClientResolve:resolve
                   reject:reject
                  perform:^(GCKRemoteMediaClient *client) {
                    return [client setPlaybackRate:playbackRate
                                        customData:customData];
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
