#ifndef RCTConvert_GCKHLSSegmentFormat_h
#define RCTConvert_GCKHLSSegmentFormat_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKHLSSegmentFormat)

+ (GCKHLSSegmentFormat)GCKHLSSegmentFormat:(nullable id)json;
+ (nonnull id)fromGCKHLSSegmentFormat:(GCKHLSSegmentFormat)trackType;

@end

#endif /* RCTConvert_GCKHLSSegmentFormat_h */
