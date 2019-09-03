#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RNGCCastContext
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener>
@end
