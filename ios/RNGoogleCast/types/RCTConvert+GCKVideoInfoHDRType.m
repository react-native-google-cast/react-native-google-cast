#import "RCTConvert+GCKVideoInfoHDRType.h"

@implementation RCTConvert (GCKVideoInfoHDRType)

RCT_ENUM_CONVERTER(GCKVideoInfoHDRType, (@{
                     @"DV" : @(GCKVideoInfoHDRTypeDV),
                     @"HDR" : @(GCKVideoInfoHDRTypeHDR),
                     @"SDR" : @(GCKVideoInfoHDRTypeSDR),
                   }),
                   GCKVideoInfoHDRTypeUnknown, integerValue)

+ (nonnull id)fromGCKVideoInfoHDRType:(GCKVideoInfoHDRType)type {
  switch (type) {
  case GCKVideoInfoHDRTypeDV:
    return @"DV";
  case GCKVideoInfoHDRTypeHDR:
    return @"HDR";
  case GCKVideoInfoHDRTypeSDR:
    return @"SDR";
  default:
    return [NSNull null];
  }
}

@end
