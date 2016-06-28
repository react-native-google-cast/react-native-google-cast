// Copyright 2013 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKCommon.h>

@class GCKApplicationMetadata;
@class GCKDevice;
@class GCKCastChannel;
@class GCKLaunchOptions;
@class GCKReceiverControlChannel;

/**
 * @file GCKDeviceManager.h
 * GCKConnectionSuspendedReason enums.
 */

/**
 * @enum GCKConnectionSuspendReason
 * Enum defining the reasons for a connection becoming suspended.
 */
typedef NS_ENUM(NSInteger, GCKConnectionSuspendReason) {
  /** The connection was suspended because the application is going into the background. */
  GCKConnectionSuspendReasonAppBackgrounded = 1,
  /** The connection was suspended because of a network or protocol error. */
  GCKConnectionSuspendReasonNetworkError = 2
};

@protocol GCKDeviceManagerDelegate;

/**
 * Controls a Cast device. This class can send messages to, receive messages from, launch, and
 * close applications running on a Cast device. <b>All methods and properties of this class may
 * only be accessed from the main thread.</b>
 * <p>
 * The GCKDeviceManager instance must stay in scope as long as a connection to the Cast device is
 * established or is in the process of being created or torn down. It is safe to release the object
 * before a connection has been started with @link connect @endlink, or after either the
 * -[deviceManager:didDisconnectWithError:], -[deviceManager:didSuspendConnectionWithReason:], or
 * -[deviceManager:didFailToConnectWithError:] delegate callback has been invoked.
 *
 * @ingroup DeviceControl
 */
GCK_EXPORT
@interface GCKDeviceManager : NSObject

/**
 * The device manager's current connection state.
 */
@property(nonatomic, readonly) GCKConnectionState connectionState;

/**
 * The device manager's current application connection state.
 */
@property(nonatomic, readonly) GCKConnectionState applicationConnectionState;

/**
 * True if the device manager has established a connection to the device.
 *
 * @deprecated {Use @link connectionState @endlink.}
 */
@property(nonatomic, readonly) BOOL isConnected GCK_DEPRECATED("Use connectionState");

/**
 * True if the device manager has established a connection to an application on the device.
 *
 * @deprecated {Use @link applicationConnectionState @endlink.}
 */
@property(nonatomic, readonly) BOOL isConnectedToApp
GCK_DEPRECATED("Use applicationConnectionState");

/**
 * True if the device manager is disconnected due to a potentially transient event (e.g. the app is
 * backgrounded, or there was a network error which might be solved by reconnecting). Note that the
 * disconnection/connection callbacks will not be called while the device manager attemps to
 * reconnect after a potentially transient event, but the properties will always reflect the
 * actual current state and can be observed.
 */
@property(nonatomic, readonly) BOOL isReconnecting;

/**
 * Reconnection will be attempted for this long in the event that the socket disconnects with a
 * potentially transient error.
 *
 * The default timeout is 15s.
 */
@property(nonatomic) NSTimeInterval reconnectTimeout;

/**
 * The device that is being controlled by this GCKDeviceManager.
 */
@property(nonatomic, readonly) GCKDevice *device;

/**
 * The delegate for receiving notifications from the GCKDeviceManager.
 */
@property(nonatomic, weak) id<GCKDeviceManagerDelegate> delegate;

/**
 * The current volume of the device, if known; otherwise <code>0</code>.
 */
@property(nonatomic, assign, readonly) float deviceVolume;

/**
 * The current mute state of the device, if known; otherwise <code>NO</code>.
 */
@property(nonatomic, assign, readonly) BOOL deviceMuted;

/**
 * The device's current "active input" status.
 */
@property(nonatomic, assign, readonly) GCKActiveInputStatus activeInputStatus;

/**
 * The device's current "standby" status.
 */
@property(nonatomic, assign, readonly) GCKStandbyStatus standbyStatus;

/**
 * The application session ID for the currently connected receiver application, if any;
 * otherwise <code>nil</code>. A new, unique session ID is generated whenever a receiver application
 * is launched (including when the same application is relaunched) and remains in effect as long as
 * the receiver application continues running.
 */
@property(nonatomic, copy, readonly) NSString *applicationSessionID;

/**
 * The metadata for the receiver application that is currently running on the receiver, if any;
 * otherwise <code>nil</code>.
 */
@property(nonatomic, copy, readonly) GCKApplicationMetadata *applicationMetadata;

/**
 * The most recently reported status text from the currently running receiver application, if any;
 * otherwise <code>nil</code>.
 */
@property(nonatomic, copy, readonly) NSString *applicationStatusText;

/**
 * Constructs a new GCKDeviceManager with the given device. The object will listen for app state
 * notifications, and will automatically disconnect from the device when the app goes into the
 * background and attempt to reconnect to the device when the app returns to the foreground.
 *
 * @param device The device to control.
 * @param clientPackageName The client package name.
 */
- (instancetype)initWithDevice:(GCKDevice *)device clientPackageName:(NSString *)clientPackageName;

/**
 * Designated initializer. Constructs a new GCKDeviceManager for controlling the given device.
 * <p>
 * If <code>ignoreAppStateNotifications</code> is <code>NO</code>, the object will listen for
 * changes to the app state and will automatically disconnect from the device when the app goes into
 * the background and attempt to reconnect to the device when the app returns to the foreground.
 * <p>
 * If <code>ignoreAppStateNotifications</code> is <code>YES</code>, the object will not listen for
 * these notifications, and it will be the app's responsibility to manage the connection lifecycle.
 * Note that in general, a backgrounded iOS app cannot continue running indefinitely, and its
 * active network connections will eventually be closed by the operating system.
 *
 * @param device The device to control.
 * @param clientPackageName The client package name.
 * @param ignoreAppStateNotifications Whether this object will ignore app state notifications.
 */
- (instancetype)initWithDevice:(GCKDevice *)device
              clientPackageName:(NSString *)clientPackageName
    ignoreAppStateNotifications:(BOOL)ignoreAppStateNotifications;

#pragma mark Device connection

/**
 * Connects to the device.
 */
- (void)connect;

/**
 * Disconnects from the device. This is an explicit disconnect.
 * <p>
 * One of the disconnect methods <b>must</b> be called at some point after @link #connect @endlink
 * was called and before this object is released by its owner.
 */
- (void)disconnect;

/**
 * Disconnects from the device. This method <b>must</b> be called at some point after
 * @link #connect @endlink was called and before this object is released by its owner.
 * <p>
 * One of the disconnect methods <b>must</b> be called at some point after @link #connect @endlink
 * was called and before this object is released by its owner.
 *
 * @param leaveApplication <code>YES</code> if this is an explicit disconnect that should
 * disconnect from ("leave") the receiver application before closing the connection; <code>NO</code>
 * if this is an implicit disconnect that should just close the connection.
 */
- (void)disconnectWithLeave:(BOOL)leaveApplication;

#pragma mark Channels

/**
 * Adds a channel which can send and receive messages for this device on a particular
 * namespace.
 *
 * @param channel The channel.
 * @return <code>YES</code> if the channel was added, <code>NO</code> if it was not added because
 * there was already a channel attached for that namespace.
 */
- (BOOL)addChannel:(GCKCastChannel *)channel;

/**
 * Removes a previously added channel.
 *
 * @param channel The channel.
 * @return <code>YES</code> if the channel was removed, <code>NO</code> if it was not removed
 * because the given channel was not previously attached.
 */
- (BOOL)removeChannel:(GCKCastChannel *)channel;

#pragma mark Applications

/**
 * Launches an application.
 *
 * @param applicationID The application ID.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)launchApplication:(NSString *)applicationID;

/**
 * Launches an application using the given launch options.
 *
 * @param applicationID The application ID.
 * @param launchOptions The launch options for this request. If <code>nil</code>, defaults will be
 * used.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)launchApplication:(NSString *)applicationID
             withLaunchOptions:(GCKLaunchOptions *)launchOptions;

/**
 * Launches an application, optionally relaunching it if it is already running.
 * @deprecated {Use <code>-[launchApplication:withLaunchOptions:]</code> instead.}
 *
 * @param applicationID The application ID.
 * @param relaunchIfRunning If <code>YES</code>, relaunches the application if it is already
 * running instead of joining the running application.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)launchApplication:(NSString *)applicationID
             relaunchIfRunning:(BOOL)relaunchIfRunning
GCK_DEPRECATED("Use launchApplication:withLaunchOptions:");

/**
 * Joins an application.
 *
 * @param applicationID The application ID. If <code>nil</code>, attempts to join whichever
 * application is currently running; otherwise, attempts to join the specified application.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)joinApplication:(NSString *)applicationID;

/**
 * Joins an application with a particular application session ID. The request will fail if the
 * given session ID is no longer active on the receiver.
 *
 * @param applicationID The application ID.
 * @param sessionID The application session ID.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)joinApplication:(NSString *)applicationID sessionID:(NSString *)sessionID;

/**
 * Leaves the current application.
 *
 * @return <code>NO</code> if the message could not be sent.
 */
- (BOOL)leaveApplication;

/**
 * Stops any running application(s).
 *
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)stopApplication;

/**
 * Stops the application with the given application session ID. The request will fail if the given
 * session ID is no longer active on the receiver.
 *
 * @param sessionID The application session ID, which may not be <code>nil</code>.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)stopApplicationWithSessionID:(NSString *)sessionID;

#pragma mark Device status

/**
 * Sets the system volume.
 *
 * @param volume The new volume, in the range [0.0, 1.0]. Out of range values will be silently
 * clipped.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)setVolume:(float)volume;

/**
 * Turns muting on or off.
 *
 * @param muted Whether audio should be muted or unmuted.
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)setMuted:(BOOL)muted;

/**
 * Requests the device's current status. This will result in all of the delegate status update
 * callbacks being invoked once the updated status information is received.
 *
 * @return The request ID, or <code>kGCKInvalidRequestID</code> if the request could not be sent.
 */
- (NSInteger)requestDeviceStatus;

@end

#pragma mark -

/**
 * The delegate for GCKDeviceManager notifications. Unless indicated otherwise, the caller should
 * <b>not</b> release the delegating GCKDeviceManager object from within a delegate method.
 *
 * @ingroup DeviceControl
 */
GCK_EXPORT
@protocol GCKDeviceManagerDelegate <NSObject>

@optional

#pragma mark Device connection callbacks

/**
 * Called when a connection has been established to the device.
 *
 * @param deviceManager The device manager.
 */
- (void)deviceManagerDidConnect:(GCKDeviceManager *)deviceManager;

/**
 * Called when the connection to the device has failed. It is safe to release the GCKDeviceManager
 * object from within this callback.
 *
 * @param deviceManager The device manager.
 * @param error The error that caused the connection to fail.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didFailToConnectWithError:(NSError *)error;

/**
 * Called when the connection to the device has been terminated. It is safe to release the
 * GCKDeviceManager object from within this callback.
 *
 * @param deviceManager The device manager.
 * @param error The error that caused the disconnection; nil if there was no error (e.g. intentional
 * disconnection).
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didDisconnectWithError:(NSError *)error;

/**
 * Called when the connection to the device has been suspended, possibly temporarily. When a
 * connection is suspended, the device manager will automatically attempt to re-establish the
 * connection at the appropriate time. The calling application should not attempt to force a
 * reconnect itself.
 *
 * @param deviceManager The device manager.
 * @param reason The reason for the suspension.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didSuspendConnectionWithReason:(GCKConnectionSuspendReason)reason;

/**
 * Called when a previously suspended device connection has been re-established.
 *
 * @param deviceManager The device manager.
 * @param rejoinedApplication If a connection had been established to a receiver application at the
 * time of the suspension, this flag indicates whether that application has been successfully
 * re-joined. This value would be <code>NO</code> if, for example, the application was terminated
 * during the time that the device manager was attempting to re-establish its connection to the
 * device.
 */
- (void)deviceManagerDidResumeConnection:(GCKDeviceManager *)deviceManager
                     rejoinedApplication:(BOOL)rejoinedApplication;

#pragma mark Application connection callbacks

/**
 * Called when an application has been launched or joined.
 *
 * @param deviceManager The device manager.
 * @param applicationMetadata Metadata about the application.
 * @param sessionID The current application session ID that is active on the receiver.
 * @param launchedApplication <code>YES</code> if the application was launched as part of the
 * connection, or <code>NO</code> if the application was already running and was joined.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didConnectToCastApplication:(GCKApplicationMetadata *)applicationMetadata
                      sessionID:(NSString *)sessionID
            launchedApplication:(BOOL)launchedApplication;

/**
 * Called when connecting to an application fails.
 *
 * @param deviceManager The device manager.
 * @param error The error that caused the failure.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didFailToConnectToApplicationWithError:(NSError *)error;

/**
 * Called when disconnected from the current application.
 *
 * @param deviceManager The device manager.
 * @param error The error that caused the disconnect, or <code>nil</code> if this was a normal
 * disconnect.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didDisconnectFromApplicationWithError:(NSError *)error;

/**
 * Called when a stop application request has completed successfully.
 *
 * @param deviceManager The device manager.
 */
- (void)deviceManagerDidStopApplication:(GCKDeviceManager *)deviceManager;

/**
 * Called when a stop application request fails.
 *
 * @param deviceManager The device manager.
 * @param error The error that caused the failure.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didFailToStopApplicationWithError:(NSError *)error;

#pragma mark Device status callbacks

/**
 * Called whenever the application metadata for the currently running application has changed.
 *
 * @param deviceManager The device manager.
 * @param metadata The application metadata. May be nil if no application is currently running.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didReceiveApplicationMetadata:(GCKApplicationMetadata *)metadata;

/**
 * Called whenever the currently running application status text has changed.
 *
 * @param deviceManager The device manager.
 * @param applicationStatusText The application status text. May be nil if no application is
 * currently running or if the application did not report any status text.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didReceiveApplicationStatusText:(NSString *)applicationStatusText;

/**
 * Called whenever the volume changes.
 *
 * @param deviceManager The device manager.
 * @param volumeLevel The current device volume level.
 * @param isMuted The current device mute state.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    volumeDidChangeToLevel:(float)volumeLevel
              isMuted:(BOOL)isMuted;

/**
 * Called whenever the active input status changes.
 *
 * @param deviceManager The device manager.
 * @param activeInputStatus The active input status.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didReceiveActiveInputStatus:(GCKActiveInputStatus)activeInputStatus;

/**
 * Called whenever the standby status changes.
 *
 * @param deviceManager The device manager.
 * @param standbyStatus The standby status.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
    didReceiveStandbyStatus:(GCKStandbyStatus)standbyStatus;

#pragma mark Request status callbacks

/**
 * Called when an asynchronous operation has failed.
 *
 * @param deviceManager The device manager.
 * @param requestID The ID of the request that failed.
 * @param error The error.
 */
- (void)deviceManager:(GCKDeviceManager *)deviceManager
              request:(NSInteger)requestID
     didFailWithError:(NSError *)error;

@end
