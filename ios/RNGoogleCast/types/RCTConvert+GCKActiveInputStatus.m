#import "RCTConvert+GCKActiveInputStatus.h"

@implementation RCTConvert (GCKActiveInputStatus)

+ (nonnull id)fromGCKActiveInputStatus:(GCKActiveInputStatus)status {
  switch (status) {
  case GCKActiveInputStatusActive:
    return @"active";
  case GCKActiveInputStatusInactive:
    return @"inactive";
  case GCKActiveInputStatusUnknown:
    return @"unknown";
  default:
    return [NSNull null];
  }
}

@end
