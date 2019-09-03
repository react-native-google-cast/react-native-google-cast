#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const CHANNEL_MESSAGE_RECEIVED =
    @"GoogleCast:ChannelMessageReceived";
static NSString *const CHANNEL_CONNECTED = @"GoogleCast:ChannelConnected";
static NSString *const CHANNEL_DISCONNECTED = @"GoogleCast:ChannelDisconnected";

@interface RNGCCastSession
    : RCTEventEmitter <RCTBridgeModule, GCKGenericChannelDelegate>
@end
