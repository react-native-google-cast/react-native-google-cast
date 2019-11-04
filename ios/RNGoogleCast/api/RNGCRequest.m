#import "RNGCRequest.h"
#import <Foundation/Foundation.h>

@implementation RNGCRequest {
  GCKRequest *request;
  RCTPromiseResolveBlock resolve;
  RCTPromiseRejectBlock reject;
}

+ (id)promisifyRequest:(GCKRequest *)request
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  return [[RNGCRequest alloc] initWithRequest:request
                                      resolve:resolve
                                       reject:reject];
}

- initWithRequest:(GCKRequest *)request
            resolve:(RCTPromiseResolveBlock)resolve
             reject:(RCTPromiseRejectBlock)reject {
  self->request = request;
  self->resolve = resolve;
  self->reject = reject;
  request.delegate = self;
  return self;
}

- (void)requestDidComplete:(GCKRequest *)request {
  resolve(nil);
}

- (void)request:(GCKRequest *)request didFailWithError:(GCKError *)error {
  reject([error localizedDescription], [error localizedFailureReason], error);
}

- (void)request:(GCKRequest *)request
    didAbortWithReason:(GCKRequestAbortReason)abortReason {
  NSString *message;
  
  switch (abortReason) {
    case GCKRequestAbortReasonReplaced:
      message = @"The request was aborted because a similar and overridding request was initiated.";
      break;
      
    case GCKRequestAbortReasonCancelled:
      message = @"The request was aborted because it was cancelled.";
      break;
      
    default:
      message = @"The request was aborted.";
      break;
  }
  
  reject(message, message, nil);
}

@end
