#import "RCTConvert+GCKCastState.h"

@implementation RCTConvert (GCKCastState)

RCT_ENUM_CONVERTER(GCKCastState, (@{
                     @"connected" : @(GCKCastStateConnected),
                     @"connecting" : @(GCKCastStateConnecting),
                     @"notConnected" : @(GCKCastStateNotConnected),
                     @"noDevicesAvailable" : @(GCKCastStateNoDevicesAvailable),
                   }),
                   GCKCastStateNoDevicesAvailable, integerValue)

+ (nonnull id)fromGCKCastState:(GCKCastState)state {
  switch (state) {
  case GCKCastStateConnected:
    return @"connected";
  case GCKCastStateConnecting:
    return @"connecting";
  case GCKCastStateNotConnected:
    return @"notConnected";
  case GCKCastStateNoDevicesAvailable:
    return @"noDevicesAvailable";
  default:
    return [NSNull null];
  }
}

@end
