#ifndef RCTConvert_GCKAdBreakInfo_h
#define RCTConvert_GCKAdBreakInfo_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKAdBreakInfo)

+ (GCKAdBreakInfo *)GCKAdBreakInfo:(id)json;
+ (nonnull id)fromGCKAdBreakInfo:(nullable GCKAdBreakInfo *)info;

@end

#endif /* RCTConvert_GCKAdBreakInfo_h */
