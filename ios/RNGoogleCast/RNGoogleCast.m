#import "RNGoogleCast.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation RNGoogleCast {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
  bool playbackStarted;
  bool playbackEnded;
  NSUInteger currentItemID;
  NSTimer *progressTimer;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

- (instancetype)init {
  self = [super init];
  channels = [[NSMutableDictionary alloc] init];
  return self;
}

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

    @"MEDIA_STATUS_UPDATED" : MEDIA_STATUS_UPDATED,
    @"MEDIA_PLAYBACK_STARTED" : MEDIA_PLAYBACK_STARTED,
    @"MEDIA_PLAYBACK_ENDED" : MEDIA_PLAYBACK_ENDED,
    @"MEDIA_PROGRESS_UPDATED" : MEDIA_PROGRESS_UPDATED,

    @"CHANNEL_CONNECTED" : CHANNEL_CONNECTED,
    @"CHANNEL_MESSAGE_RECEIVED" : CHANNEL_MESSAGE_RECEIVED,
    @"CHANNEL_DISCONNECTED" : CHANNEL_DISCONNECTED
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    SESSION_STARTING, SESSION_STARTED, SESSION_START_FAILED, SESSION_SUSPENDED,
    SESSION_RESUMING, SESSION_RESUMED, SESSION_ENDING, SESSION_ENDED, MEDIA_PROGRESS_UPDATED,

    MEDIA_STATUS_UPDATED, MEDIA_PLAYBACK_STARTED, MEDIA_PLAYBACK_ENDED,

    CHANNEL_CONNECTED, CHANNEL_MESSAGE_RECEIVED, CHANNEL_DISCONNECTED
  ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager addListener:self];
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
// FIXME: this crashes on (hot) reload
//  [GCKCastContext.sharedInstance.sessionManager removeListener:self];
}

# pragma mark - GCKCastContext methods

RCT_REMAP_METHOD(getCastState,
                 getCastStateWithResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve(@([GCKCastContext.sharedInstance castState]));
  });
}

RCT_EXPORT_METHOD(launchExpandedControls) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentDefaultExpandedMediaControls];
  });
}

RCT_EXPORT_METHOD(showIntroductoryOverlay) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentCastInstructionsViewControllerOnce];
  });
}

# pragma mark - GCKCastSession methods

RCT_EXPORT_METHOD(initChannel: (NSString *)namespace) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKGenericChannel *channel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    channel.delegate = self;
    channels[namespace] = channel;
    [castSession addChannel:channel];
  });
}

# pragma mark - GCKCastSessionManager methods

RCT_EXPORT_METHOD(endSession: (BOOL)stopCasting
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if ([GCKCastContext.sharedInstance.sessionManager endSessionAndStopCasting:stopCasting]) {
      resolve(@(YES));
    } else {
      NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:GCKErrorCodeNoMediaSession userInfo:nil];
      reject(@"no_session", @"No castSession!", error);
    }
  });
}

#pragma mark - GCKCastChannel methods

RCT_EXPORT_METHOD(sendMessage: (NSString *)message toNamespace: (NSString *)namespace) {
  GCKCastChannel *channel = channels[namespace];
  if (channel) {
    [channel sendTextMessage:message error:nil];
  }
}

# pragma mark - GCKRemoteMediaClient methods

RCT_EXPORT_METHOD(castMedia: (NSDictionary *)params
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  NSString *mediaUrl = [RCTConvert NSString:params[@"mediaUrl"]];
  NSString *title = [RCTConvert NSString:params[@"title"]];
  NSString *subtitle = [RCTConvert NSString:params[@"subtitle"]];
  NSString *studio = [RCTConvert NSString:params[@"studio"]];
  NSString *imageUrl = [RCTConvert NSString:params[@"imageUrl"]];
  NSString *posterUrl = [RCTConvert NSString:params[@"posterUrl"]];
  double streamDuration = [RCTConvert double:params[@"streamDuration"]];
  double playPosition = [RCTConvert double:params[@"playPosition"]];

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
  if (castSession) {
    [castSession.remoteMediaClient loadMedia:mediaInfo
                                    autoplay:YES
                                playPosition:playPosition];
    resolve(mediaInfo);
  } else {
    NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:GCKErrorCodeNoMediaSession userInfo:nil];
    reject(@"no_session", @"No castSession!", error);
  }
}

RCT_EXPORT_METHOD(play) {
  if (castSession) {
    [castSession.remoteMediaClient play];
  }
}

RCT_EXPORT_METHOD(pause) {
  if (castSession) {
    [castSession.remoteMediaClient pause];
  }
}

RCT_EXPORT_METHOD(stop) {
  if (castSession) {
    [castSession.remoteMediaClient stop];
  }
}

RCT_EXPORT_METHOD(seek : (int)playPosition) {
  if (castSession) {
    [castSession.remoteMediaClient seekToTimeInterval:playPosition];
  }
}

#pragma mark - GCKSessionManagerListener events

-(void)sessionManager:(GCKSessionManager *)sessionManager willStartCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_STARTING body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
  castSession = session;
  [session.remoteMediaClient addListener:self];
  [self sendEventWithName:SESSION_STARTED body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager didFailToStartCastSession:(GCKCastSession *)session withError:(NSError *)error {
  [self sendEventWithName:SESSION_START_FAILED
                     body:@{@"error":[error localizedDescription]}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager didSuspendCastSession:(GCKCastSession *)session withReason:(GCKConnectionSuspendReason)reason {
  castSession = nil;
  [session.remoteMediaClient removeListener:self];
  [self sendEventWithName:SESSION_SUSPENDED body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager willResumeCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_RESUMING body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
  castSession = session;
  [session.remoteMediaClient addListener:self];
  [self sendEventWithName:SESSION_RESUMED body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager willEndCastSession:(GCKCastSession *)session {
  castSession = nil;
  [session.remoteMediaClient removeListener:self];
  [self sendEventWithName:SESSION_ENDING body:@{}];
}

-(void)sessionManager:(GCKSessionManager *)sessionManager didEndCastSession:(GCKCastSession *)session withError:(NSError *)error {
  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  if (error) {
    body[@"error"] = [error localizedDescription];
  }
  [self sendEventWithName:SESSION_ENDED body:body];
}

#pragma mark - GCKRemoteMediaClientListener events

- (void)remoteMediaClient:(GCKRemoteMediaClient *)client didUpdateMediaStatus:(GCKMediaStatus *)mediaStatus {

  if (currentItemID != mediaStatus.currentItemID) {
    // reset item status
    currentItemID = mediaStatus.currentItemID;
    playbackStarted = false;
    playbackEnded = false;
  }
    
  NSDictionary *status = @{
    @"playerState": @(mediaStatus.playerState),
    @"idleReason": @(mediaStatus.idleReason),
    @"muted": @(mediaStatus.isMuted),
    @"streamPosition": @(mediaStatus.streamPosition),
    @"streamDuration": @(mediaStatus.mediaInformation.streamDuration),
  };

  [self sendEventWithName:MEDIA_STATUS_UPDATED body:@{@"mediaStatus":status}];

  if (mediaStatus.playerState == GCKMediaPlayerStatePlaying) {
    if (!progressTimer) {
      progressTimer = [NSTimer scheduledTimerWithTimeInterval:1.0 
                                target:self
                                selector:@selector(progressUpdated:)
                                userInfo:@(mediaStatus.mediaInformation.streamDuration)
                                repeats:YES];
    }
  } else {
    [progressTimer invalidate];
    progressTimer = nil;
  }

  if (!playbackStarted && mediaStatus.playerState == GCKMediaPlayerStatePlaying) {
    [self sendEventWithName:MEDIA_PLAYBACK_STARTED body:@{@"mediaStatus":status}];
    playbackStarted = true;
  }

  if (!playbackEnded && mediaStatus.idleReason == GCKMediaPlayerIdleReasonFinished) {
    [self sendEventWithName:MEDIA_PLAYBACK_ENDED body:@{@"mediaStatus":status}];
    playbackEnded = true;
  }
}

-(void) progressUpdated:(NSTimer*)theTimer {
  NSDictionary *progress = @{
    @"progress": @([castSession.remoteMediaClient approximateStreamPosition]),
    @"duration": [theTimer userInfo],
  };
  [self sendEventWithName:MEDIA_PROGRESS_UPDATED body:@{@"mediaProgress":progress}];
}

#pragma mark - GCKGenericChannelDelegate events

-(void)castChannel:(GCKGenericChannel *)channel didReceiveTextMessage:(NSString *)message withNamespace:(NSString *)protocolNamespace {
  [self sendEventWithName:CHANNEL_MESSAGE_RECEIVED body:@{@"message":message, @"channel":protocolNamespace}];
}

-(void)castChannelDidConnect:(GCKGenericChannel *)channel {
    [self sendEventWithName:CHANNEL_CONNECTED body:@{@"channel":channel.protocolNamespace}];
}

-(void)castChannelDidDisconnect:(GCKGenericChannel *)channel {
    [self sendEventWithName:CHANNEL_DISCONNECTED body:@{@"channel":channel.protocolNamespace}];
}

@end
