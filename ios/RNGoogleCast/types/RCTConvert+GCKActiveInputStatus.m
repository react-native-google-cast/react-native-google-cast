#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKActiveInputStatus)

+ (id)fromGCKActiveInputStatus:(GCKActiveInputStatus)status {
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
