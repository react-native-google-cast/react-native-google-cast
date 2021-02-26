#import "RCTConvert+GCKStandbyStatus.h"

@implementation RCTConvert (GCKStandbyStatus)

+ (nonnull id)fromGCKStandbyStatus:(GCKStandbyStatus)status {
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
