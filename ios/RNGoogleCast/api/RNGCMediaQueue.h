#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

static NSString *const QUEUE_CHANGED = @"GoogleCast:QueueChanged";
static NSString *const QUEUE_RECEIVED_ITEM = @"GoogleCast:QueueReceivedItem";

@interface RNGCMediaQueue : RCTEventEmitter <RCTBridgeModule, GCKMediaQueueDelegate, GCKSessionManagerListener>
  
@end
