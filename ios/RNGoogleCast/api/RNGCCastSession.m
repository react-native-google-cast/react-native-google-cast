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

- (NSDictionary *)constantsToExport {
  return @{
    @"CHANNEL_CONNECTED" : CHANNEL_CONNECTED,
    @"CHANNEL_MESSAGE_RECEIVED" : CHANNEL_MESSAGE_RECEIVED,
    @"CHANNEL_DISCONNECTED" : CHANNEL_DISCONNECTED
  };
}

- (NSArray<NSString *> *)supportedEvents {
  return @[ CHANNEL_CONNECTED, CHANNEL_MESSAGE_RECEIVED, CHANNEL_DISCONNECTED ];
}

- (void)castChannel:(GCKGenericChannel *)channel
    didReceiveTextMessage:(NSString *)message
            withNamespace:(NSString *)protocolNamespace {
  [self sendEventWithName:CHANNEL_MESSAGE_RECEIVED
                     body:@{
                       @"message" : message,
                       @"channel" : protocolNamespace
                     }];
}

- (void)castChannelDidConnect:(GCKGenericChannel *)channel {
  [self sendEventWithName:CHANNEL_CONNECTED
                     body:@{@"channel" : channel.protocolNamespace}];
}

- (void)castChannelDidDisconnect:(GCKGenericChannel *)channel {
  [self sendEventWithName:CHANNEL_DISCONNECTED
                     body:@{@"channel" : channel.protocolNamespace}];
}

RCT_EXPORT_METHOD(initChannel: (NSString *)namespace) {
  dispatch_async(dispatch_get_main_queue(), ^{
    GCKGenericChannel *channel = [[GCKGenericChannel alloc] initWithNamespace:namespace];
    //    channel.delegate = self;
    self->channels[namespace] = channel;
    [self->castSession addChannel:channel];
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

#pragma mark - GCKCastChannel methods

RCT_EXPORT_METHOD(sendMessage: (NSString *)message toNamespace: (NSString *)namespace) {
  GCKCastChannel *channel = channels[namespace];
  if (channel) {
    [channel sendTextMessage:message error:nil];
  }
}

@end
