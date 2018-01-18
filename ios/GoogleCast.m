#import "GoogleCast.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation GoogleCast {
  bool hasListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (NSDictionary *)constantsToExport {
  return @{
    @"SESSION_STARTING" : SESSION_STARTING,
    @"SESSION_STARTED" : SESSION_STARTED,
    @"SESSION_START_FAILED" : SESSION_START_FAILED,
    @"SESSION_SUSPENDED" : SESSION_SUSPENDED,
    @"SESSION_RESUMING" : SESSION_RESUMING,
    @"SESSION_RESUMED" : SESSION_RESUMED,
    @"SESSION_ENDING" : SESSION_ENDING,
    @"SESSION_ENDED" : SESSION_ENDED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    SESSION_STARTING, SESSION_STARTED, SESSION_START_FAILED, SESSION_SUSPENDED,
    SESSION_RESUMING, SESSION_RESUMED, SESSION_ENDING, SESSION_ENDED
  ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKCastContext *castContext = [GCKCastContext sharedInstance];
    [castContext.sessionManager addListener:self];
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
// TODO [[GCKCastContext sharedInstance].sessionManager removeListener:self];
}

RCT_EXPORT_METHOD(castMedia : (NSDictionary *)params) {
  NSString *mediaUrl = [RCTConvert NSString:params[@"mediaUrl"]];
  NSString *title = [RCTConvert NSString:params[@"title"]];
  NSString *subtitle = [RCTConvert NSString:params[@"subtitle"]];
  NSString *studio = [RCTConvert NSString:params[@"studio"]];
  NSString *imageUrl = [RCTConvert NSString:params[@"imageUrl"]];
  NSString *posterUrl = [RCTConvert NSString:params[@"posterUrl"]];
  double streamDuration = [RCTConvert double:params[@"streamDuration"]];
  double playPosition = [RCTConvert double:params[@"playPosition"]];

  RCTLogInfo(@"casting media");

  playPosition = !playPosition ? 0 : playPosition;

  GCKMediaMetadata *metadata =
      [[GCKMediaMetadata alloc] initWithMetadataType:GCKMediaMetadataTypeMovie];

  if (title) {
    [metadata setString:title forKey:kGCKMetadataKeyTitle];
  }
  if (subtitle) {
    [metadata setString:subtitle forKey:kGCKMetadataKeySubtitle];
  }
  if (studio) {
    [metadata setString:studio forKey:kGCKMetadataKeyStudio];
  }

  [metadata addImage:[[GCKImage alloc]
                         initWithURL:[[NSURL alloc] initWithString:imageUrl]
                               width:480
                              height:360]];

  if (posterUrl) {
    [metadata addImage:[[GCKImage alloc]
                           initWithURL:[[NSURL alloc] initWithString:posterUrl]
                                 width:480
                                height:720]];
  }
  GCKMediaInformation *mediaInfo =
      [[GCKMediaInformation alloc] initWithContentID:mediaUrl
                                          streamType:GCKMediaStreamTypeBuffered
                                         contentType:@"video/mp4"
                                            metadata:metadata
                                      streamDuration:streamDuration
                                         mediaTracks:nil
                                      textTrackStyle:nil
                                          customData:nil];

  // Cast the video.
  GCKCastSession *castSession =
    [GCKCastContext sharedInstance].sessionManager.currentCastSession;
  if (castSession) {
    [castSession.remoteMediaClient loadMedia:mediaInfo
                                    autoplay:YES
                                playPosition:playPosition];
  } else {
    NSLog(@"no castSession!");
  }
}

RCT_EXPORT_METHOD(play) {
  GCKCastSession *castSession =
    [GCKCastContext sharedInstance].sessionManager.currentCastSession;

    if (castSession) {
      [castSession.remoteMediaClient play];
    }
}

RCT_EXPORT_METHOD(pause) {
    GCKCastSession *castSession =
    [GCKCastContext sharedInstance].sessionManager.currentCastSession;

    if (castSession) {
        [castSession.remoteMediaClient pause];
    }
}

RCT_EXPORT_METHOD(stop) {
    GCKCastSession *castSession =
    [GCKCastContext sharedInstance].sessionManager.currentCastSession;

    if (castSession) {
        [castSession.remoteMediaClient stop];
    }
}

RCT_EXPORT_METHOD(seek : (int)playPosition) {
    GCKCastSession *castSession =
    [GCKCastContext sharedInstance].sessionManager.currentCastSession;

    if (castSession) {
        [castSession.remoteMediaClient seekToTimeInterval:playPosition];
    }
}

RCT_EXPORT_METHOD(launchExpandedControls) {
    dispatch_async(dispatch_get_main_queue(), ^{
      [[GCKCastContext sharedInstance] presentDefaultExpandedMediaControls];
    });
}

RCT_EXPORT_METHOD(showIntroductoryOverlay) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [[GCKCastContext sharedInstance] presentCastInstructionsViewControllerOnce];
  });
}

#pragma mark SessionManagerListener

- (void)sessionManager:(GCKSessionManager *)sessionManager
      willStartSession:(GCKSession *)session {
  [self sendEventWithName:SESSION_STARTING body:@"willStartSession"];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
       didStartSession:(GCKSession *)session {
  [self sendEventWithName:SESSION_STARTED body:@"didStartSession"];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
        willEndSession:(GCKSession *)session {
  [self sendEventWithName:SESSION_ENDING body:@"willEndSession"];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
         didEndSession:(GCKSession *)session
             withError:(NSError *)error {
  [self sendEventWithName:SESSION_ENDED body:[error localizedDescription]];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didFailToStartSession:(GCKSession *)session
                withError:(NSError *)error {
  [self sendEventWithName:SESSION_START_FAILED
                     body:[error localizedDescription]];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
     didSuspendSession:(GCKSession *)session
            withReason:(GCKConnectionSuspendReason)reason {
  [self sendEventWithName:SESSION_SUSPENDED body:@"didSuspendSession"];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
     willResumeSession:(GCKSession *)session {
  [self sendEventWithName:SESSION_RESUMING body:@"willResumeSession"];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
      didResumeSession:(GCKSession *)session {
  [self sendEventWithName:SESSION_RESUMED body:@"didResumeSession"];
}

@end
