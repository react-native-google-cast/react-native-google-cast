#ifndef RCTConvert_GCKHLSVideoSegmentFormat_h
#define RCTConvert_GCKHLSVideoSegmentFormat_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKHLSVideoSegmentFormat)

+ (GCKHLSVideoSegmentFormat)GCKHLSVideoSegmentFormat:(nullable id)json;
+ (nonnull id)fromGCKHLSVideoSegmentFormat:(GCKHLSVideoSegmentFormat)format;

@end

#endif /* RCTConvert_GCKHLSVideoSegmentFormat_h */
