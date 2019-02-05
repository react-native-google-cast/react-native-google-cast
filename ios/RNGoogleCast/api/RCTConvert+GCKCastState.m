#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKCastState)

RCT_ENUM_CONVERTER(GCKCastState, (@{
                     @"Connected" : @(GCKCastStateConnected),
                     @"Connecting" : @(GCKCastStateConnecting),
                     @"NotConnected" : @(GCKCastStateNotConnected),
                     @"NoDevicesAvailable" : @(GCKCastStateNoDevicesAvailable),
                   }),
                   GCKCastStateNoDevicesAvailable, integerValue)

+ (id)fromGCKCastState:(GCKCastState)state {
  switch (state) {
  case GCKCastStateConnected:
    return @"Connected";
  case GCKCastStateConnecting:
    return @"Connecting";
  case GCKCastStateNotConnected:
    return @"NotConnected";
  case GCKCastStateNoDevicesAvailable:
    return @"NoDevicesAvailable";
  default:
    return nil;
  }
}

@end
