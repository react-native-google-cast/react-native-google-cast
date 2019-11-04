#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKHLSSegmentFormat)

RCT_ENUM_CONVERTER(GCKHLSSegmentFormat, (@{
                     @"AAC" : @(GCKHLSSegmentFormatAAC),
                     @"AC3" : @(GCKHLSSegmentFormatAC3),
                     @"MP3" : @(GCKHLSSegmentFormatMP3),
                     @"TS" : @(GCKHLSSegmentFormatTS),
                     @"TS_AAC" : @(GCKHLSSegmentFormatTS_AAC),
                   }),
                   GCKHLSSegmentFormatUndefined, integerValue)

+ (id)fromGCKHLSSegmentFormat:(GCKHLSSegmentFormat)trackType {
  switch (trackType) {
  case GCKHLSSegmentFormatAAC:
    return @"AAC";
  case GCKHLSSegmentFormatAC3:
    return @"AC3";
  case GCKHLSSegmentFormatMP3:
    return @"MP3";
  case GCKHLSSegmentFormatTS:
    return @"TS";
  case GCKHLSSegmentFormatTS_AAC:
    return @"TS_AAC";
  default:
    return [NSNull null];
  }
}

@end
