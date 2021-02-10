#ifndef RCTConvert_GCKDevice_h
#define RCTConvert_GCKDevice_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKDevice)

+ (nonnull id)fromGCKDevice:(nullable GCKDevice *)device;

@end

#endif /* RCTConvert_GCKDevice_h */
