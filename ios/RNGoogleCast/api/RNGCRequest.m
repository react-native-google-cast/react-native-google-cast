#import "RNGCRequest.h"
#import <Foundation/Foundation.h>

@implementation RNGCRequest {
  GCKRequest *request;
  RCTPromiseResolveBlock resolve;
  RCTPromiseRejectBlock reject;
}

// store pointers so that the requests don't dealloc before resolving
static NSMutableDictionary *requests;

+ (id)promisifyRequest:(GCKRequest *)request
               resolve:(RCTPromiseResolveBlock)resolve
                reject:(RCTPromiseRejectBlock)reject {
  RNGCRequest *req = [[RNGCRequest alloc] initWithRequest:request
                                      resolve:resolve
                                       reject:reject];
  if (requests == nil) requests = [[NSMutableDictionary alloc] init];
  [requests setObject:req forKey:[@([request requestID]) stringValue]];
  return req;
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
  [requests removeObjectForKey:[@([request requestID]) stringValue]];
}

- (void)request:(GCKRequest *)request didFailWithError:(GCKError *)error {
  reject([error localizedDescription], [error localizedFailureReason], error);
  [requests removeObjectForKey:[@([request requestID]) stringValue]];
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
  [requests removeObjectForKey:[@([request requestID]) stringValue]];
}

@end
