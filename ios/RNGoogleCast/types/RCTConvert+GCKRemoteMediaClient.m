#import "RCTConvert+GCKRemoteMediaClient.h"

@implementation RCTConvert (GCKRemoteMediaClient)

+ (nonnull id)fromGCKRemoteMediaClient:(nullable GCKRemoteMediaClient *)client {
  if (client == nil) return [NSNull null];
  
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  return json;
}

@end
