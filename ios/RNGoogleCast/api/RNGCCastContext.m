#import "RNGCCastContext.h"
#import "RNGCSessionManager.h"
#import "../types/RCTConvert+GCKCastState.m"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation RNGCCastContext {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSDictionary *)constantsToExport {
  NSMutableDictionary<NSString *, NSString *>* constants = [NSMutableDictionary new];
  
  for (NSString* key in RNGCSessionManager.constantsToExport) {
    [constants setValue:RNGCSessionManager.constantsToExport[key] forKey:key];
  }
  
  return constants;
}

- (NSArray<NSString *> *)supportedEvents {
  NSArray<NSString *> *events = @[];
  
  events = [events arrayByAddingObjectsFromArray:RNGCSessionManager.supportedEvents];
  
  return events;
}

- (instancetype)init {
  if (self = [super init]) {
    channels = [[NSMutableDictionary alloc] init];
  }
  return self;
}

// Will be called when this module's first listener is added.
- (void)startObserving {
  hasListeners = YES;
  // Set up any upstream listeners or background tasks as necessary
  dispatch_async(dispatch_get_main_queue(), ^{
//    [GCKCastContext.sharedInstance.sessionManager addListener:self];
  });
}

// Will be called when this module's last listener is removed, or on dealloc.
- (void)stopObserving {
  hasListeners = NO;
  // Remove upstream listeners, stop unnecessary background tasks
// FIXME: this crashes on (hot) reload
//  [GCKCastContext.sharedInstance.sessionManager removeListener:self];
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

RCT_EXPORT_METHOD(launchExpandedControls) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentDefaultExpandedMediaControls];
  });
}

RCT_EXPORT_METHOD(showIntroductoryOverlay) {
  dispatch_async(dispatch_get_main_queue(), ^{
    [GCKCastContext.sharedInstance presentCastInstructionsViewControllerOnce];
  });
}

@end
