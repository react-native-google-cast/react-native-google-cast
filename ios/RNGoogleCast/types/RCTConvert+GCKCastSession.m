#import "RCTConvert+GCKCastSession.h"

@implementation RCTConvert (GCKCastSession)

+ (nonnull id)fromGCKCastSession:(nullable GCKCastSession *)castSession {
  if (castSession == nil) return [NSNull null];
  
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"id"] = castSession.sessionID;

  return json;
}

@end
