#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const MEDIA_STATUS_UPDATED = @"GoogleCast:MediaStatusUpdated";
static NSString *const MEDIA_PLAYBACK_STARTED =
    @"GoogleCast:MediaPlaybackStarted";
static NSString *const MEDIA_PLAYBACK_ENDED = @"GoogleCast:MediaPlaybackEnded";

@interface RNGCRemoteMediaClient
    : RCTEventEmitter <RCTBridgeModule, GCKRemoteMediaClientListener>

@end
