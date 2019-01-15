#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const SESSION_STARTING = @"GoogleCast:SessionStarting";
static NSString *const SESSION_STARTED = @"GoogleCast:SessionStarted";
static NSString *const SESSION_START_FAILED = @"GoogleCast:SessionStartFailed";
static NSString *const SESSION_SUSPENDED = @"GoogleCast:SessionSuspended";
static NSString *const SESSION_RESUMING = @"GoogleCast:SessionResuming";
static NSString *const SESSION_RESUMED = @"GoogleCast:SessionResumed";
static NSString *const SESSION_ENDING = @"GoogleCast:SessionEnding";
static NSString *const SESSION_ENDED = @"GoogleCast:SessionEnded";

static NSString *const MEDIA_STATUS_UPDATED = @"GoogleCast:MediaStatusUpdated";
static NSString *const MEDIA_PLAYBACK_STARTED = @"GoogleCast:MediaPlaybackStarted";
static NSString *const MEDIA_PLAYBACK_ENDED = @"GoogleCast:MediaPlaybackEnded";
static NSString *const MEDIA_PROGRESS_UPDATED = @"GoogleCast:MediaProgressUpdated";

static NSString *const CHANNEL_MESSAGE_RECEIVED = @"GoogleCast:ChannelMessageReceived";
static NSString *const CHANNEL_CONNECTED = @"GoogleCast:ChannelConnected";
static NSString *const CHANNEL_DISCONNECTED = @"GoogleCast:ChannelDisconnected";

@interface RNGoogleCast
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener,
                       GCKSessionManagerListener, GCKRemoteMediaClientListener,
                       GCKGenericChannelDelegate>
@end
