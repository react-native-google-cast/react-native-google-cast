#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>


@interface RNGoogleCast
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener,
                       
                       GCKGenericChannelDelegate>
@end
