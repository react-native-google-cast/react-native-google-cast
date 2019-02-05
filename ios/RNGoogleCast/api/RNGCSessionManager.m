#import "RNGCSessionManager.h"
#import <Foundation/Foundation.h>

@implementation RNGCSessionManager {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
  bool playbackStarted;
  bool playbackEnded;
  NSUInteger currentItemID;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

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
  [self sendEventWithName:SESSION_STARTING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didStartCastSession:(GCKCastSession *)session {
  castSession = session;
  [session.remoteMediaClient addListener:self];
  [self sendEventWithName:SESSION_STARTED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didFailToStartCastSession:(GCKCastSession *)session
                    withError:(NSError *)error {
  [self sendEventWithName:SESSION_START_FAILED
                     body:@{@"error" : [error localizedDescription]}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didSuspendCastSession:(GCKCastSession *)session
               withReason:(GCKConnectionSuspendReason)reason {
  castSession = nil;
  [session.remoteMediaClient removeListener:self];
  [self sendEventWithName:SESSION_SUSPENDED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willResumeCastSession:(GCKCastSession *)session {
  [self sendEventWithName:SESSION_RESUMING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    didResumeCastSession:(GCKCastSession *)session {
  castSession = session;
  [session.remoteMediaClient addListener:self];
  [self sendEventWithName:SESSION_RESUMED body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
    willEndCastSession:(GCKCastSession *)session {
  castSession = nil;
  [session.remoteMediaClient removeListener:self];
  [self sendEventWithName:SESSION_ENDING body:@{}];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager
     didEndCastSession:(GCKCastSession *)session
             withError:(NSError *)error {
  NSMutableDictionary *body = [[NSMutableDictionary alloc] init];
  if (error) {
    body[@"error"] = [error localizedDescription];
  }
  [self sendEventWithName:SESSION_ENDED body:body];
}

@end
