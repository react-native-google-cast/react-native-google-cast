#import "RNGCGenericChannel.h"
#import <Foundation/Foundation.h>

@implementation RNGCGenericChannel {
  bool hasListeners;
  NSMutableDictionary *channels;
  GCKCastSession *castSession;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE();

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

@end
