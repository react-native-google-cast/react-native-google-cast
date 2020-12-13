#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const MEDIA_STATUS_UPDATED = @"GoogleCast:MediaStatusUpdated";

@interface RNGCRemoteMediaClient
    : RCTEventEmitter <RCTBridgeModule, GCKSessionManagerListener, GCKRemoteMediaClientListener>

@end
