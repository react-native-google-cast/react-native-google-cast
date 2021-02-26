#import "RNGCDiscoveryManager.h"
#import <Foundation/Foundation.h>

@implementation RNGCDiscoveryManager {
  BOOL hasListeners;
}

RCT_EXPORT_MODULE()

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"DEVICES_UPDATED" : DEVICES_UPDATED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    DEVICES_UPDATED
  ];
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.discoveryManager addListener:self];
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  if (!hasListeners) { return; }
  hasListeners = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance.discoveryManager removeListener:self];
  });
}

- (void)invalidate {
  [self stopObserving];
}

RCT_REMAP_METHOD(startDiscovery,
                 startDiscoveryResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  [GCKCastContext.sharedInstance.discoveryManager startDiscovery];
  resolve(nil);
}

RCT_REMAP_METHOD(stopDiscovery,
                 stopDiscoveryResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  [GCKCastContext.sharedInstance.discoveryManager stopDiscovery];
  resolve(nil);
}

@end
