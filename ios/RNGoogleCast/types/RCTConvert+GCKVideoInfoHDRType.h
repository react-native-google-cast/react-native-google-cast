#ifndef RCTConvert_GCKVideoInfoHDRType_h
#define RCTConvert_GCKVideoInfoHDRType_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKVideoInfoHDRType)

+ (GCKVideoInfoHDRType)GCKVideoInfoHDRType:(nullable id)json;
+ (nonnull id)fromGCKVideoInfoHDRType:(GCKVideoInfoHDRType)type;

@end

#endif /* RCTConvert_GCKVideoInfoHDRType_h */
