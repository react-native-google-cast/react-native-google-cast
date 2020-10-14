#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKCastSession)

+ (id)fromGCKCastSession:(nullable GCKCastSession *)castSession {
  if (castSession == nil) return [NSNull null];
  
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  json[@"id"] = castSession.sessionID;

  return json;
}

@end
