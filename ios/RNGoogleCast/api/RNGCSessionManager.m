#import "RNGCSessionManager.h"
#import "RNGCRemoteMediaClient.h"
#import "../types/RCTConvert+GCKCastSession.m"
#import <Foundation/Foundation.h>

@implementation RNGCSessionManager {
  BOOL hasListeners;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"SESSION_STARTING" : SESSION_STARTING,
    @"SESSION_STARTED" : SESSION_STARTED,
    @"SESSION_START_FAILED" : SESSION_START_FAILED,
    @"SESSION_SUSPENDED" : SESSION_SUSPENDED,
    @"SESSION_RESUMING" : SESSION_RESUMING,
    @"SESSION_RESUMED" : SESSION_RESUMED,
    @"SESSION_ENDING" : SESSION_ENDING,
    @"SESSION_ENDED" : SESSION_ENDED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    SESSION_STARTING,
    SESSION_STARTED,
    SESSION_START_FAILED,
    SESSION_SUSPENDED,
    SESSION_RESUMING,
    SESSION_RESUMED,
    SESSION_ENDING,
    SESSION_ENDED,
  ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager addListener:self];
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  if (!hasListeners) { return; }
  hasListeners = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager removeListener:self];
  });
}

- (void)invalidate {
  [self stopObserving];
}

RCT_EXPORT_METHOD(endCurrentSession: (BOOL)stopCasting
                  resolver: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager
     endSessionAndStopCasting:stopCasting];
    resolve(nil);
  });
}

RCT_REMAP_METHOD(getCurrentCastSession,
                 getCurrentCastSessionResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  GCKSessionManager *sessionManager = GCKCastContext.sharedInstance.sessionManager;
  resolve([RCTConvert fromGCKCastSession:sessionManager.currentCastSession]);
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willStartCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_STARTING body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didStartCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_STARTED body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didFailToStartCastSession:(GCKCastSession *)session
                    withError:(NSError *)error {
  [self sendEventWithName:SESSION_START_FAILED body:@{
    @"session": [RCTConvert fromGCKCastSession:session],
    @"error": [error localizedDescription]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didSuspendCastSession:(GCKCastSession *)session
               withReason:(GCKConnectionSuspendReason)reason {
  [self sendEventWithName:SESSION_SUSPENDED body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
    // TODO @"reason": [RCTConvert fromGCKConnectionSuspendReason:reason]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willResumeCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_RESUMING body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didResumeCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_RESUMED body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willEndCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_ENDING body:@{
    @"session": [RCTConvert fromGCKCastSession:session]
  }];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
     didEndCastSession:(GCKCastSession *)session
             withError:(nullable NSError *)error {
  [self sendEventWithName:SESSION_ENDED body:@{
    @"session": [RCTConvert fromGCKCastSession:session],
    @"error": error == nil ? [NSNull null] : [error localizedDescription]
  }];
}

@end
