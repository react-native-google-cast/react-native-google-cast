#import "RNGCMediaQueue.h"
#import <Foundation/Foundation.h>
#import <React/RCTConvert.h>
#import "../types/RCTConvert+GCKMediaQueue.m"

@implementation RNGCMediaQueue {
	GCKMediaQueue *queue;
  bool hasListeners;
}

RCT_EXPORT_MODULE()

- (NSDictionary *)constantsToExport {
  return @{
    @"QUEUE_CHANGED" : QUEUE_CHANGED,
    @"QUEUE_RECEIVED_ITEM" : QUEUE_RECEIVED_ITEM,
  };
}

-(void)startObserving {
  hasListeners = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager addListener:self];

    self->queue = [self getQueue];
    if (self->queue != nil) {
      [self->queue addDelegate:self];
    }
  });
}

-(void)stopObserving {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.sessionManager removeListener:self];
    
    self->queue = [self getQueue];
    if (self->queue != nil) {
      [self->queue removeDelegate:self];
    }
  });
  hasListeners = NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    QUEUE_CHANGED,
    QUEUE_RECEIVED_ITEM,
  ];
}

RCT_REMAP_METHOD(getState,
                 getStateWithResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve([RCTConvert fromGCKMediaQueue:self->queue]);
  });
}

RCT_EXPORT_METHOD(getItemWithId: (NSUInteger) itemId
                  fetchIfNeeded: (BOOL) fetchIfNeeded) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKMediaQueue *queue = self->queue;
    if (queue == nil) {
  //    NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:0 userInfo:nil];
  //    reject(@"no_queue", @"No queue available", error);
      return;
    }
    
    NSInteger index = [queue indexOfItemWithID:itemId];
    if (index == NSNotFound) {
      return;
    }

    GCKMediaQueueItem *item = [queue itemAtIndex:index fetchIfNeeded:fetchIfNeeded];
    if (item && self->hasListeners) { // Only send events if anyone is listening
      [self sendEventWithName:QUEUE_RECEIVED_ITEM body:[RCTConvert fromGCKMediaQueueItem:item]];
    }
  });
}

# pragma mark - GCKSessionManager events

- (void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
  queue = [session.remoteMediaClient mediaQueue];
  [queue addDelegate:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
  queue = [session.remoteMediaClient mediaQueue];
  [queue addDelegate:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager willEndCastSession:(GCKCastSession *)session {
  [queue removeDelegate:self];
}

# pragma mark - GCKMediaQueue events

- (void) mediaQueue:(GCKMediaQueue *)queue didUpdateItemsAtIndexes:(NSArray<NSNumber *> *)indexes {
  if (hasListeners) { // Only send events if anyone is listening
    for (NSNumber *index in indexes) {
      GCKMediaQueueItem *item = [queue itemAtIndex:[index unsignedIntegerValue] fetchIfNeeded:NO];
      if (item) {
        [self sendEventWithName:QUEUE_RECEIVED_ITEM body:[RCTConvert fromGCKMediaQueueItem:item]];
      }
    }
  }
}
- (void)mediaQueueDidChange:(GCKMediaQueue *)queue {
  if (hasListeners) {
    [self sendEventWithName:QUEUE_CHANGED body:[RCTConvert fromGCKMediaQueue:queue]];
  }
}

# pragma mark - Helpers

- (nullable GCKMediaQueue *)getQueue {
  GCKSession *session =
      GCKCastContext.sharedInstance.sessionManager.currentSession;

  if (session == nil || session.remoteMediaClient == nil) { return nil; }

  return [session.remoteMediaClient mediaQueue];
}

@end
