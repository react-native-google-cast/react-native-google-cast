#import "RCTConvert+GCKHLSSegmentFormat.h"

@implementation RCTConvert (GCKHLSSegmentFormat)

RCT_ENUM_CONVERTER(GCKHLSSegmentFormat, (@{
                     @"AAC" : @(GCKHLSSegmentFormatAAC),
                     @"AC3" : @(GCKHLSSegmentFormatAC3),
                     @"E-AC3" : @(GCKHLSSegmentFormatE_AC3),
                     @"FMP4" : @(GCKHLSSegmentFormatFMP4),
                     @"MP3" : @(GCKHLSSegmentFormatMP3),
                     @"TS" : @(GCKHLSSegmentFormatTS),
                     @"TS_AAC" : @(GCKHLSSegmentFormatTS_AAC),
                   }),
                   GCKHLSSegmentFormatUndefined, integerValue)

+ (nonnull id)fromGCKHLSSegmentFormat:(GCKHLSSegmentFormat)format {
  switch (format) {
  case GCKHLSSegmentFormatAAC:
    return @"AAC";
  case GCKHLSSegmentFormatAC3:
    return @"AC3";
  case GCKHLSSegmentFormatE_AC3:
    return @"E-AC3";
  case GCKHLSSegmentFormatFMP4:
    return @"FMP4";
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
