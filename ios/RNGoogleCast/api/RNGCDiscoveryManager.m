#import "RNGCDiscoveryManager.h"
#import "../types/RCTConvert+GCKDevice.h"

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

RCT_EXPORT_METHOD(getDevices: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    resolve([self getDevices]);
  });
}

-(void)didUpdateDeviceList {
  [self sendEventWithName:DEVICES_UPDATED body:[self getDevices]];
}

RCT_EXPORT_METHOD(isPassiveScan: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  resolve(@([GCKCastContext.sharedInstance.discoveryManager passiveScan]));
}

RCT_EXPORT_METHOD(isRunning: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  resolve(@([GCKCastContext.sharedInstance.discoveryManager discoveryActive]));
}

RCT_EXPORT_METHOD(setPassiveScan: (BOOL) on
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  [GCKCastContext.sharedInstance.discoveryManager setPassiveScan:on];
  resolve(nil);
}

RCT_EXPORT_METHOD(startDiscovery: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  [GCKCastContext.sharedInstance.discoveryManager startDiscovery];
  resolve(nil);
}

RCT_EXPORT_METHOD(stopDiscovery: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  [GCKCastContext.sharedInstance.discoveryManager stopDiscovery];
  resolve(nil);
}

-(NSMutableArray<id> *)getDevices {
  NSMutableArray<id> *devices = [[NSMutableArray alloc] init];

  GCKDiscoveryManager *discoveryManager = GCKCastContext.sharedInstance.discoveryManager;
  NSUInteger deviceCount = [discoveryManager deviceCount];
  for (int i = 0; i < deviceCount; i++) {
    GCKDevice *device = [discoveryManager deviceAtIndex:i];
    [devices addObject:[RCTConvert fromGCKDevice:device]];
  }
  
  return devices;
}

@end
