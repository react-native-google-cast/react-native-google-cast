#import "RCTConvert+GCKMediaRepeatMode.h"

@implementation RCTConvert (GCKMediaRepeatMode)

RCT_ENUM_CONVERTER(GCKMediaRepeatMode, (@{
                     @"all" : @(GCKMediaRepeatModeAll),
                     @"allAndShuffle" : @(GCKMediaRepeatModeAllAndShuffle),
                     @"off" : @(GCKMediaRepeatModeOff),
                     @"single" : @(GCKMediaRepeatModeSingle),
                   }),
                   GCKMediaRepeatModeUnchanged, integerValue)

+ (nonnull id)fromGCKMediaRepeatMode:(GCKMediaRepeatMode)mode {
  switch (mode) {
  case GCKMediaRepeatModeAll:
    return @"all";
  case GCKMediaRepeatModeAllAndShuffle:
    return @"allAndShuffle";
  case GCKMediaRepeatModeOff:
    return @"off";
  case GCKMediaRepeatModeSingle:
    return @"single";
  default:
    return [NSNull null];
  }
}

@end
