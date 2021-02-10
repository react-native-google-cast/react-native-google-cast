#ifndef RCTConvert_GCKColor_h
#define RCTConvert_GCKColor_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKColor)

+ (GCKColor *)GCKColor:(id)json;
+ (nonnull id)fromGCKColor:(nullable GCKColor *)color;

@end

#endif /* RCTConvert_GCKColor_h */
