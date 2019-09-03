#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const MEDIA_STATUS_UPDATED = @"GoogleCast:MediaStatusUpdated";
static NSString *const MEDIA_PLAYBACK_STARTED =
    @"GoogleCast:MediaPlaybackStarted";
static NSString *const MEDIA_PLAYBACK_ENDED = @"GoogleCast:MediaPlaybackEnded";

@interface RNGCRemoteMediaClient
    : RCTEventEmitter <GCKRemoteMediaClientListener>

+ (RNGCRemoteMediaClient)initWithClient:(GCKRemoteMediaClient)client;

+ constantsToExport = @{
  @"MEDIA_STATUS_UPDATED" : MEDIA_STATUS_UPDATED,
  @"MEDIA_PLAYBACK_STARTED" : MEDIA_PLAYBACK_STARTED,
  @"MEDIA_PLAYBACK_ENDED" : MEDIA_PLAYBACK_ENDED,
};

+ supportedEvents = @[
  MEDIA_STATUS_UPDATED,
  MEDIA_PLAYBACK_STARTED,
  MEDIA_PLAYBACK_ENDED,
];

@end
