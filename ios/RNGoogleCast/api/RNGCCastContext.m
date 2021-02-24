#import "RNGCCastContext.h"
#import "RNGCSessionManager.h"
#import "../types/RCTConvert+GCKCastState.m"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation RNGCCastContext {
  bool hasListeners;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"CAST_STATE_CHANGED": CAST_STATE_CHANGED
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    CAST_STATE_CHANGED
  ];
}

// Called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
  [[NSNotificationCenter defaultCenter]
    addObserver:self
       selector:@selector(castStateDidChange:)
           name:kGCKCastStateDidChangeNotification
         object:[GCKCastContext sharedInstance]];
}

// Called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  if (!hasListeners) { return; }
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
  [[NSNotificationCenter defaultCenter]
    removeObserver:self
              name:kGCKCastStateDidChangeNotification
            object:[GCKCastContext sharedInstance]];
}

// Called when the native bridge is invalidated (ie: on devmode reload).
- (void)invalidate {
  [self stopObserving];
}

# pragma mark - GCKCastContext methods

RCT_REMAP_METHOD(getCastState,
                 getCastStateWithResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKCastState state = [GCKCastContext.sharedInstance castState];
    resolve([RCTConvert fromGCKCastState:state]);
  });
}

RCT_REMAP_METHOD(showCastDialog,
                 showCastDialogWithResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentCastDialog];
    resolve(@(YES));
  });
}

RCT_REMAP_METHOD(showExpandedControls,
                 showExpandedControlsWithResolver: (RCTPromiseResolveBlock) resolve
                 rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentDefaultExpandedMediaControls];
    resolve(@(YES));
  });
}

RCT_EXPORT_METHOD(showIntroductoryOverlay:(id)options
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    if (!options[@"once"]) {
      [GCKCastContext.sharedInstance clearCastInstructionsShownFlag];
    }

    resolve(@([GCKCastContext.sharedInstance presentCastInstructionsViewControllerOnce]));
  });
}

- (void)castStateDidChange:(NSNotification *)notification {
  if (!hasListeners) return;

  GCKCastState state = [GCKCastContext sharedInstance].castState;
  [self sendEventWithName:CAST_STATE_CHANGED
                     body:[RCTConvert fromGCKCastState:state]];
}

@end
