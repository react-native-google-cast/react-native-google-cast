#import <GoogleCast/GoogleCast.h>
#import <React/RCTEventEmitter.h>

static NSString *const DEVICES_UPDATED = @"GoogleCast:DevicesUpdated";

@interface RNGCDiscoveryManager : RCTEventEmitter <GCKDiscoveryManagerListener>
  
@end
