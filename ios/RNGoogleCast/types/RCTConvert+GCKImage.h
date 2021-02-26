#ifndef RCTConvert_GCKImage_h
#define RCTConvert_GCKImage_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKImage)

+ (GCKImage *)GCKImage:(id)json;
+ (nonnull id)fromGCKImage:(nullable GCKImage *)image;

@end

#endif /* RCTConvert_GCKImage_h */
