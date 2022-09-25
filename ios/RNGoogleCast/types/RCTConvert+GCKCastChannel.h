#ifndef RCTConvert_GCKCastChannel_h
#define RCTConvert_GCKCastChannel_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKCastChannel)

+ (nonnull id)fromGCKCastChannel:(nullable GCKCastChannel *)castSession;

@end

#endif /* RCTConvert_GCKCastChannel_h */
