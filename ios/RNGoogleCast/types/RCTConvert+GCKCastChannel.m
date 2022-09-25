#import "RCTConvert+GCKCastChannel.h"

@implementation RCTConvert (GCKCastChannel)

+ (nonnull id)fromGCKCastChannel:(nullable GCKCastChannel *)castChannel {
  if (castChannel == nil) return [NSNull null];
  
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"connected"] = @(castChannel.isConnected);
  json[@"namespace"] = castChannel.protocolNamespace;
  json[@"writable"] = @(castChannel.isWritable);

  return json;
}

@end
