#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const CAST_STATE_CHANGED =
@"GoogleCast:CastStateChanged";

@interface RNGCCastContext
    : RCTEventEmitter <RCTBridgeModule, GCKCastDeviceStatusListener>
@end
