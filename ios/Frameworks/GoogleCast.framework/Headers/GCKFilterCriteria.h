// Copyright 2013 Google Inc.

#import <GoogleCast/GCKDefines.h>

/**
 * Filter criteria to be applied to the results of device discovery. The criteria is used to
 * restrict which discovered devices are published by the GCKDeviceScanner. There are two ways to
 * filter the results of a device discovery scan:
 *
 * <ul>
 * <li>By receiver application ID. Only those devices which support the given receiver application
 * will be included in the results. This is the most commonly used criteria; a sender application
 * will only want to discover those devices that actually support the corresponding receiver
 * application. This is particularly important in the presence of devices with various hardware
 * capabilities; for example, a video player application should not cast to an audio-only Cast
 * device.
 *
 * <li>By supported namespaces. Only those devices which are currently running a receiver
 * application that supports the given protocol namespaces will be included in the results. As an
 * example, this type of criteria would be used by a generic remote-control sender application which
 * can be used with any receiver application that supports the media namespace.
 * </ul>
 *
 * @ingroup Discovery
 */
GCK_EXPORT
@interface GCKFilterCriteria : NSObject <NSCopying, NSCoding>

/**
 * Criteria for an application which is available to be launched on a device. The application does
 * not need to be currently running.
 *
 * @param applicationID The application ID. Must be non-nil.
 */
+ (instancetype)criteriaForAvailableApplicationWithID:(NSString *)applicationID;

/**
 * Criteria for an application which is currently running on the device and supports all of
 * the given namespaces, optionally also with a particular application ID.
 *
 * @param applicationID The application ID. Optional; may be nil, in which case only the namespace
 * will be used.
 * @param supportedNamespaces An array of namespace strings. Must be non-nil.
 *
 * @deprecated {This method is deprecated. Filtering by running application ID is not supported by
 * the SDK. Calling this method will ignore the applicationID parameter and simply delegate to
 * @link #criteriaForRunningApplicationWithSupportedNamespaces: @endlink.}
 */
+ (instancetype)criteriaForRunningApplicationWithID:(NSString *)applicationID
                                supportedNamespaces:(NSArray *)supportedNamespaces
GCK_DEPRECATED("Use criteriaForRunningApplicationWithSupportedNamespaces");

/**
 * Criteria for an application which is currently running on the device and supports all of
 * the given namespaces.
 *
 * @param supportedNamespaces An array of namespace strings. Must be non-nil.
 */
+ (instancetype)criteriaForRunningApplicationWithSupportedNamespaces:(NSArray *)supportedNamespaces;

@end
