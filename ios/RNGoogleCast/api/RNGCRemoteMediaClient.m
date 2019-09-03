#import "RNGCRemoteMediaClient.h"
#import "RNGCRequest.h"
#import "../types/RCTConvert+GCKMediaInformation.m"
#import "../types/RCTConvert+GCKMediaLoadOptions.m"
#import "../types/RCTConvert+GCKMediaStatus.m"
#import <Foundation/Foundation.h>

@implementation RNGCRemoteMediaClient {
  GCKRemoteMediaClient *client;
  NSUInteger currentItemID;
  bool playbackStarted;
  bool playbackEnded;
}

- (instancetype)initWithClient:(GCKRemoteMediaClient *)client {
  if (self = [super init]) {
    self->client = client;
  }
  return self;
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

  [RNGCRequest promisifyRequest:[client loadMedia:mediaInfo withOptions:loadOptions] resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(play
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  
  [RNGCRequest promisifyRequest:[client playWithCustomData:customData] resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(pause
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {

  [RNGCRequest promisifyRequest:[client pauseWithCustomData:customData] resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(stop
                  : (NSDictionary *)customData resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  
  [RNGCRequest promisifyRequest:[client stopWithCustomData:customData] resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(seek
                  : (GCKMediaSeekOptions *)options resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {

  [RNGCRequest promisifyRequest:[client seekWithOptions:options] resolve:resolve reject:reject];
}

RCT_EXPORT_METHOD(setPlaybackRate
                  : (float)playbackRate customData
                  : (NSDictionary *)customData
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {

  [RNGCRequest promisifyRequest:[client setPlaybackRate:playbackRate
                                             customData:customData] resolve:resolve reject:reject];
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
