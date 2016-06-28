// Copyright 2014 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKCastChannel.h>
#import <GoogleCast/GCKDefines.h>

@protocol GCKGenericChannelDelegate;

/**
 * A generic GCKCastChannel implementation that defers processing of incoming events to a delegate,
 * suitable for use when creating a namespace-specific subclass of GCKCastChannel is not desired.
 *
 * @ingroup Messages
 */
GCK_EXPORT
@interface GCKGenericChannel : GCKCastChannel

/**
 * The delegate for receiving notifications about changes in the channel's state.
 */
@property(nonatomic, weak) id<GCKGenericChannelDelegate> delegate;

/**
 * Designated initializer.
 *
 * @param protocolNamespace The namespace for this channel.
 */
- (instancetype)initWithNamespace:(NSString *)protocolNamespace NS_DESIGNATED_INITIALIZER;

@end

/**
 * The delegate for GCKGenericChannel notifications.
 */
GCK_EXPORT
@protocol GCKGenericChannelDelegate <NSObject>

/**
 * Called when a text message has been received on the channel.
 */
- (void)castChannel:(GCKGenericChannel *)channel
    didReceiveTextMessage:(NSString *)message
      withNamespace:(NSString *)protocolNamespace;

@optional

/**
 * Called when the channel has been connected, indicating that messages can now be exchanged with
 * the Cast device over the channel.
 */
- (void)castChannelDidConnect:(GCKGenericChannel *)channel;

/**
 * Called when the channel has been disconnected, indicating that messages can no longer be
 * exchanged with the Cast device over the channel.
 */
- (void)castChannelDidDisconnect:(GCKGenericChannel *)channel;

@end
