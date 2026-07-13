#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>
#import "./RCTConvert+GCKMediaQueueItem.m"

@implementation RCTConvert (GCKMediaQueue)

+ (nonnull id)fromGCKMediaQueue:(nullable GCKMediaQueue *)queue {
  if (queue == nil) return [NSNull null];

  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"count"] = @(queue.itemCount);
  
  json[@"queuedIds"] = [[NSMutableArray alloc] init];
  for (NSInteger i = 0; i < queue.itemCount; i++) {
    [json[@"queuedIds"] addObject:@([queue itemIDAtIndex:i])];
  }
  
  return json;
}

@end

