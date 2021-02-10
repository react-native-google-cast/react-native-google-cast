#ifndef RCTConvert_GCKMediaLoadRequest_h
#define RCTConvert_GCKMediaLoadRequest_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKMediaLoadRequest)

+ (nonnull GCKMediaLoadRequestData *)GCKMediaLoadRequestData:(nonnull id)json;

@end

#endif /* RCTConvert_GCKMediaLoadRequest_h */
