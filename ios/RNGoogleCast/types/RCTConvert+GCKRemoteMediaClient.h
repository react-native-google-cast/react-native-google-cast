#ifndef RCTConvert_GCKRemoteMediaClient_h
#define RCTConvert_GCKRemoteMediaClient_h

#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@interface RCTConvert (GCKRemoteMediaClient)

+ (nonnull id)fromGCKRemoteMediaClient:(nullable GCKRemoteMediaClient *)client;

@end

#endif /* RCTConvert_GCKRemoteMediaClient_h */
