#import <GoogleCast/GoogleCast.h>
#import <React/RCTBridgeModule.h>

@interface RNGCRequest : NSObject <GCKRequestDelegate>

+ promisifyRequest:(GCKRequest *)request
             resolve:(RCTPromiseResolveBlock)resolve
              reject:(RCTPromiseRejectBlock)reject;

@end
