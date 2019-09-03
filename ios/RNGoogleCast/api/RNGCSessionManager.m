#import "RNGCSessionManager.h"
#import "RNGCRemoteMediaClient.h"
#import <Foundation/Foundation.h>

@implementation RNGCSessionManager {
  GCKCastSession *castSession;
  RNGCRemoteMediaClient *client;
}

RCT_EXPORT_METHOD(endSession
                  : (BOOL)stopCasting resolver
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if ([GCKCastContext.sharedInstance.sessionManager
            endSessionAndStopCasting:stopCasting]) {
      resolve(@(YES));
    } else {
      NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain
                                           code:GCKErrorCodeNoMediaSession
                                       userInfo:nil];
      reject(@"no_session", @"No castSession!", error);
    }
  });
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willStartCastSession:(GCKCastSession *)session {
  [module sendEventWithName:SESSION_STARTING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didStartCastSession:(GCKCastSession *)session {
  castSession = session;
  client = [[RNGCRemoteMediaClient alloc] initWithClient:session.remoteMediaClient];
  [session.remoteMediaClient addListener:client];
  [module sendEventWithName:SESSION_STARTED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didFailToStartCastSession:(GCKCastSession *)session
                    withError:(NSError *)error {
  [module sendEventWithName:SESSION_START_FAILED
                       body:@{@"error" : [error localizedDescription]}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didSuspendCastSession:(GCKCastSession *)session
               withReason:(GCKConnectionSuspendReason)reason {
  castSession = nil;
  [session.remoteMediaClient removeListener:client];
  [module sendEventWithName:SESSION_SUSPENDED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willResumeCastSession:(GCKCastSession *)session {
  [module sendEventWithName:SESSION_RESUMING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didResumeCastSession:(GCKCastSession *)session {
  castSession = session;
  [session.remoteMediaClient addListener:client];
  [module sendEventWithName:SESSION_RESUMED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willEndCastSession:(GCKCastSession *)session {
  castSession = nil;
  [session.remoteMediaClient removeListener:client];
  [module sendEventWithName:SESSION_ENDING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
     didEndCastSession:(GCKCastSession *)session
             withError:(NSError *)error {
  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  if (error) {
    body[@"error"] = [error localizedDescription];
  }
  [module sendEventWithName:SESSION_ENDED body:body];
}

@end
