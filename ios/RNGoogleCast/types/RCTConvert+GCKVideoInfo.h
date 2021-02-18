#ifndef RCTConvert_GCKVideoInfo_h
#define RCTConvert_GCKVideoInfo_h


#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKVideoInfo)

+ (nonnull id)fromGCKVideoInfo:(nullable GCKVideoInfo *)video;

@end

#endif /* RCTConvert_GCKVideoInfo_h */
