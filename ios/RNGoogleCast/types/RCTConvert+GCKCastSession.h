#ifndef RCTConvert_GCKCastSession_h
#define RCTConvert_GCKCastSession_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKCastSession)

+ (nonnull id)fromGCKCastSession:(nullable GCKCastSession *)castSession;

@end

#endif /* RCTConvert_GCKCastSession_h */
