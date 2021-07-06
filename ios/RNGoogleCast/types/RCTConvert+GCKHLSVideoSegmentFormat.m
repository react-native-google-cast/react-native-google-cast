#import "RCTConvert+GCKHLSVideoSegmentFormat.h"

@implementation RCTConvert (GCKHLSVideoSegmentFormat)

RCT_ENUM_CONVERTER(GCKHLSVideoSegmentFormat, (@{
                     @"FMP4" : @(GCKHLSVideoSegmentFormatFMP4),
                     @"MPEG2-TS" : @(GCKHLSVideoSegmentFormatMPEG2_TS),
                   }),
                   GCKHLSVideoSegmentFormatUndefined, integerValue)

+ (nonnull id)fromGCKHLSVideoSegmentFormat:(GCKHLSVideoSegmentFormat)format {
  switch (format) {
  case GCKHLSVideoSegmentFormatFMP4:
    return @"FMP4";
  case GCKHLSVideoSegmentFormatMPEG2_TS:
    return @"MPEG2-TS";
  default:
    return [NSNull null];
  }
}

@end
