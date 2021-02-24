#import "RNGCCastSession.h"
#import "../types/RCTConvert+GCKActiveInputStatus.m"
#import "../types/RCTConvert+GCKApplicationMetadata.m"
#import "../types/RCTConvert+GCKCastSession.m"
#import "../types/RCTConvert+GCKDevice.m"
#import "../types/RCTConvert+GCKStandbyStatus.m"
#import <Foundation/Foundation.h>

@implementation RNGCCastSession {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

+ (BOOL)requiresMainQueueSetup {
  return NO;
}

- (instancetype)init {
  if (self = [super init]) {
    channels = [[NSMutableDictionary alloc] init];
    
    dispatch_async(dispatch_get_main_queue(), ^{
      self->castSession = [GCKCastContext.sharedInstance.sessionManager currentCastSession];
      [GCKCastContext.sharedInstance.sessionManager addListener:self];
    });
  }
  return self;
}

- (NSDictionary *)constantsToExport {
  return @{
    @"ACTIVE_INPUT_STATE_CHANGED": ACTIVE_INPUT_STATE_CHANGED,
    @"CHANNEL_MESSAGE_RECEIVED": CHANNEL_MESSAGE_RECEIVED,
    @"STANDBY_STATE_CHANGED": STANDBY_STATE_CHANGED,
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[
    ACTIVE_INPUT_STATE_CHANGED,
    CHANNEL_MESSAGE_RECEIVED,
    STANDBY_STATE_CHANGED,
  ];
}

- (void)startObserving {
  hasListeners = YES;
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKCastSession *session = [GCKCastContext.sharedInstance.sessionManager currentCastSession];
    if (session != nil) {
      [session addDeviceStatusListener:self];
    }
  });
}

- (void)stopObserving {
  if (!hasListeners) { return; }
  hasListeners = NO;
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKCastSession *session = [GCKCastContext.sharedInstance.sessionManager currentCastSession];
    if (session != nil) {
      [session removeDeviceStatusListener:self];
    }
  });
}

- (void)invalidate {
  [self stopObserving];
  dispatch_async(dispatch_get_main_queue(), ^{
    self->castSession = nil;
    [GCKCastContext.sharedInstance.sessionManager removeListener:self];
  });
}

# pragma mark - GCKCastSession methods

RCT_EXPORT_METHOD(getActiveInputState
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve([RCTConvert fromGCKActiveInputStatus:[castSession activeInputStatus]]);
}

RCT_EXPORT_METHOD(getApplicationMetadata
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve([RCTConvert fromGCKApplicationMetadata:[castSession applicationMetadata]]);
}

RCT_EXPORT_METHOD(getApplicationStatus
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve([castSession deviceStatusText]);
}

RCT_EXPORT_METHOD(getCastDevice
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve([RCTConvert fromGCKDevice:[castSession device]]);
}

RCT_EXPORT_METHOD(getStandbyState
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve([RCTConvert fromGCKStandbyStatus:[castSession standbyStatus]]);
}

RCT_EXPORT_METHOD(getVolume
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve(@([castSession currentDeviceVolume]));
}

RCT_EXPORT_METHOD(isMute
                  : (RCTPromiseResolveBlock)resolve rejecter
                  : (RCTPromiseRejectBlock)reject) {
  resolve(@([castSession currentDeviceMuted]));
}

# pragma mark - GCKCastDeviceStatusListener events

- (void)castSession:(GCKCastSession *)castSession didReceiveActiveInputStatus:(GCKActiveInputStatus)activeInputStatus {
  if (!hasListeners) return;
  [self sendEventWithName:ACTIVE_INPUT_STATE_CHANGED body:[RCTConvert fromGCKActiveInputStatus:activeInputStatus]];
}

- (void)castSession:(GCKCastSession *)castSession didReceiveStandbyStatus:(GCKStandbyStatus)standbyStatus {
  if (!hasListeners) return;
  [self sendEventWithName:STANDBY_STATE_CHANGED body:[RCTConvert fromGCKStandbyStatus:standbyStatus]];
}

# pragma mark - GCKCastChannel methods

RCT_EXPORT_METHOD(addChannel: (NSString *)namespace
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKGenericChannel *channel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    channel.delegate = self;
    [self->channels setObject:channel forKey:namespace];
    [self->castSession addChannel:channel];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(removeChannel: (NSString *)namespace
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  GCKCastChannel *channel = self->channels[namespace];
  if (channel == nil) { return resolve(nil); }
  
  dispatch_async(dispatch_get_main_queue(), ^{
    [self->channels removeObjectForKey:namespace];
    [self->castSession removeChannel:channel];
    resolve(nil);
  });
}

RCT_EXPORT_METHOD(sendMessage: (NSString *)namespace
                  message: (NSString *)message
                  resolver: (RCTPromiseResolveBlock) resolve
                  rejecter: (RCTPromiseRejectBlock) reject) {
  GCKCastChannel *channel = channels[namespace];
  if (!channel) {
    NSError *error = [NSError errorWithDomain:NSCocoaErrorDomain code:GCKErrorCodeChannelNotConnected userInfo:nil];
    return reject(@"no_channel", [NSString stringWithFormat:@"Channel for namespace %@ does not exist. Did you forget to call addChannel?", namespace], error);
  }
  
  NSError *error;
  [channel sendTextMessage:message error:&error];
  if (error == nil) {
    resolve(nil);
  } else {
    reject(error.localizedFailureReason, error.localizedDescription, error);
  }
}

# pragma mark - GCKCastChannel events

- (void)castChannel:(GCKGenericChannel *)channel
    didReceiveTextMessage:(NSString *)message
            withNamespace:(NSString *)protocolNamespace {
  if (!hasListeners) return;
  [self sendEventWithName:CHANNEL_MESSAGE_RECEIVED
                     body:@{
                       @"namespace": protocolNamespace,
                       @"message": message
                     }];
}

# pragma mark - GCKSessionManager events

- (void)sessionManager:(GCKSessionManager *)sessionManager didStartCastSession:(GCKCastSession *)session {
  self->castSession = session;
  [session addDeviceStatusListener:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager didResumeCastSession:(GCKCastSession *)session {
  self->castSession = session;
  [session addDeviceStatusListener:self];
}

- (void)sessionManager:(GCKSessionManager *)sessionManager willEndCastSession:(GCKCastSession *)session {
  self->castSession = nil;
  [session removeDeviceStatusListener:self];
}

@end
