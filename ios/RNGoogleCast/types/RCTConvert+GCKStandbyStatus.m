#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKStandbyStatus)

+ (id)fromGCKStandbyStatus:(GCKStandbyStatus)status {
  switch (status) {
  case GCKStandbyStatusActive:
    return @"active";
  case GCKStandbyStatusInactive:
    return @"inactive";
  case GCKStandbyStatusUnknown:
    return @"unknown";
  default:
    return [NSNull null];
  }
}

@end
