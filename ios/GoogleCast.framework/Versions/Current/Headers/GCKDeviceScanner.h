// Copyright 2013 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

@class GCKDevice;
@class GCKFilterCriteria;
@protocol GCKDeviceScannerListener;

/**
 * A class that (asynchronously) scans for available devices and sends corresponding notifications
 * to its listener(s). This class is implicitly a singleton; since it does a network scan, it isn't
 * useful to have more than one instance of it in use. <b>All methods and properties of this class
 * may only be accessed from the main thread.</b>
 *
 * @ingroup Discovery
 */
GCK_EXPORT
@interface GCKDeviceScanner : NSObject

/** The array of discovered devices. */
@property(nonatomic, readonly, copy) NSArray *devices;

/** Whether the current/latest scan has discovered any devices. */
@property(nonatomic, readonly) BOOL hasDiscoveredDevices;

/** Whether a scan is currently in progress. */
@property(nonatomic, readonly) BOOL scanning;

/** The current filtering criteria. */
@property(nonatomic, copy) GCKFilterCriteria *filterCriteria;

/**
 * Whether the scan should be a passive scan. A passive scan sends discovery queries less
 * frequently, so it is more efficient, but the results will not be as fresh. It's appropriate to
 * do a passive scan when the user is not actively selecting a Cast target.
 */
@property(nonatomic, assign) BOOL passiveScan;

/**
 * Constructs a new GCKDeviceScanner.
 * @deprecated {Use @link #initWithFilterCriteria: @endlink instead, do not use without a criteria.}
 */
- (instancetype)init GCK_DEPRECATED("Use initWithFilterCriteria, do not use without a criteria");

/**
 * Designated initializer. Constructs a new GCKDeviceScanner with the given filter criteria.
 *
 * @param filterCriteria The filter criteria. May not be <code>nil</code>.
 */
- (instancetype)initWithFilterCriteria:(GCKFilterCriteria *)filterCriteria;

/**
 * Starts a new device scan. The scan must eventually be stopped by calling
 * @link #stopScan @endlink.
 */
- (void)startScan;

/**
 * Stops any in-progress device scan. This method <b>must</b> be called at some point after
 * @link #startScan @endlink was called and before this object is released by its owner.
 */
- (void)stopScan;

/**
 * Adds a listener for receiving notifications.
 *
 * @param listener The listener to add.
 */
- (void)addListener:(id<GCKDeviceScannerListener>)listener;

/**
 * Removes a listener that was previously added with @link #addListener: @endlink.
 *
 * @param listener The listener to remove.
 */
- (void)removeListener:(id<GCKDeviceScannerListener>)listener;

@end

/**
 * The listener interface for GCKDeviceScanner notifications.
 *
 * @ingroup Discovery
 */
GCK_EXPORT
@protocol GCKDeviceScannerListener <NSObject>

@optional

/**
 * Called when a device has been discovered or has come online.
 *
 * @param device The device.
 */
- (void)deviceDidComeOnline:(GCKDevice *)device;

/**
 * Called when a device has gone offline.
 *
 * @param device The device.
 */
- (void)deviceDidGoOffline:(GCKDevice *)device;

/**
 * Called when there is a change to one or more properties of the device that do not affect
 * connectivity to the device. This includes all properties except the device ID, IP address,
 * and service port; if any of these properties changes, the device will be reported as "offline"
 * and a new device with the updated properties will be reported as "online".
 *
 * @param device The device.
 */
- (void)deviceDidChange:(GCKDevice *)device;

@end
