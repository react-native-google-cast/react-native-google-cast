#import "RNGoogleCast.h"
#import "api/RCTConvert+GCKCastState.m"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTEventDispatcher.h>
#import <React/RCTLog.h>

@implementation RNGoogleCast {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
  bool playbackStarted;
  bool playbackEnded;
  NSUInteger currentItemID;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (NSArray<NSString *> *)supportedEvents {
  return @[];
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
    [GCKCastContext.sharedInstance.sessionManager addListener:self];
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

# pragma mark - GCKCastSession methods

RCT_EXPORT_METHOD(initChannel: (NSString *)namespace) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKGenericChannel *channel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    channel.delegate = self;
    channels[namespace] = channel;
    [castSession addChannel:channel];
  });
}

#pragma mark - GCKCastChannel methods

RCT_EXPORT_METHOD(sendMessage: (NSString *)message toNamespace: (NSString *)namespace) {
  GCKCastChannel *channel = channels[namespace];
  if (channel) {
    [channel sendTextMessage:message error:nil];
  }
}

@end
