#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaRepeatMode)

RCT_ENUM_CONVERTER(GCKMediaRepeatMode, (@{
                     @"All" : @(GCKMediaRepeatModeAll),
                     @"AllAndShuffle" : @(GCKMediaRepeatModeAllAndShuffle),
                     @"Off" : @(GCKMediaRepeatModeOff),
                     @"Single" : @(GCKMediaRepeatModeSingle),
                   }),
                   GCKMediaRepeatModeUnchanged, integerValue)

+ (id)fromGCKMediaRepeatMode:(GCKMediaRepeatMode)mode {
  switch (mode) {
  case GCKMediaRepeatModeAll:
    return @"All";
  case GCKMediaRepeatModeAllAndShuffle:
    return @"AllAndShuffle";
  case GCKMediaRepeatModeOff:
    return @"Off";
  case GCKMediaRepeatModeSingle:
    return @"Single";
  default:
    return nil;
  }
}

@end
