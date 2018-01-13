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
    @"DEVICE_AVAILABLE" : DEVICE_AVAILABLE,
    @"DEVICE_CONNECTED" : DEVICE_CONNECTED,
    @"DEVICE_DISCONNECTED" : DEVICE_DISCONNECTED,
    @"MEDIA_LOADED" : MEDIA_LOADED,
    @"SESSION_ENDED" : SESSION_ENDED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ DEVICE_CONNECTED, DEVICE_DISCONNECTED, SESSION_ENDED ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
}

RCT_EXPORT_METHOD(castMedia : (NSDictionary *)params) {
  NSString *mediaUrl = [RCTConvert NSString:params[@"mediaUrl"]];
  NSString *title = [RCTConvert NSString:params[@"title"]];
  NSString *subtitle = [RCTConvert NSString:params[@"subtitle"]];
  NSString *studio = [RCTConvert NSString:params[@"studio"]];
  NSString *imageUrl = [RCTConvert NSString:params[@"imageUrl"]];
  NSString *posterUrl = [RCTConvert NSString:params[@"posterUrl"]];
  double duration = [RCTConvert double:params[@"duration"]];
  double seconds = [RCTConvert double:params[@"seconds"]];

  RCTLogInfo(@"casting media");

  seconds = !seconds ? 0 : seconds;

  GCKMediaMetadata *metadata =
      [[GCKMediaMetadata alloc] initWithMetadataType:GCKMediaMetadataTypeMovie];

  [metadata setString:title forKey:kGCKMetadataKeyTitle];
  if (subtitle) {
    //  [metadata setString:subtitle forKey:kMediaKeyDescription];
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
                                      streamDuration:duration
                                         mediaTracks:nil
                                      textTrackStyle:nil
                                          customData:nil];

  // Cast the video.
  GCKCastSession *castSession =
      [GCKCastContext sharedInstance].sessionManager.currentCastSession;
  if (castSession) {
    [castSession.remoteMediaClient loadMedia:mediaInfo autoplay:YES];
    //                                    playPosition:seconds];
  } else {
    NSLog(@"no castSession!");
  }
}

RCT_EXPORT_METHOD(togglePauseCast) {
  BOOL isPlaying = self.mediaControlChannel.mediaStatus.playerState ==
                   GCKMediaPlayerStatePlaying;
  isPlaying ? [self.mediaControlChannel pause]
            : [self.mediaControlChannel play];
}

RCT_EXPORT_METHOD(seekCast : (double)seconds) {
  [self.mediaControlChannel seekToTimeInterval:seconds];
}

RCT_REMAP_METHOD(getStreamPosition, resolved
                 : (RCTPromiseResolveBlock)resolve rejected
                 : (RCTPromiseRejectBlock)reject) {
  double time = [self.mediaControlChannel approximateStreamPosition];
  resolve(@(time));
}

@end
