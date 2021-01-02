#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const ACTIVE_INPUT_STATE_CHANGED =
    @"GoogleCast:ActiveInputStateChanged";
static NSString *const CHANNEL_MESSAGE_RECEIVED = @"GoogleCast:ChannelMessageReceived";
static NSString *const STANDBY_STATE_CHANGED = @"GoogleCast:StandbyStateChanged";

@interface RNGCCastSession
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener, GCKGenericChannelDelegate, GCKSessionManagerListener>
@end
