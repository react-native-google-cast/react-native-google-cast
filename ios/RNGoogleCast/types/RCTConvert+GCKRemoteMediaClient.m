#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKRemoteMediaClient)

+ (id)fromGCKRemoteMediaClient:(nullable GCKRemoteMediaClient *)client {
  if (client == nil) return [NSNull null];
  
  NSMutableDictionary *json = [[NSMutableDictionary alloc] init];

  return json;
}

@end
