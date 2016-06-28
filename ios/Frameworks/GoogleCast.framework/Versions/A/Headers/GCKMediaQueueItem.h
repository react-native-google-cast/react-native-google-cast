// Copyright 2015 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

@class GCKMediaInformation;
@class GCKMediaQueueItemBuilder;

extern const NSUInteger kGCKMediaQueueInvalidItemID;

/**
 * A class representing a media queue item. Instances of this object are immutable.
 * <p>
 * This class is used in two-way communication between a sender application and a receiver
 * application. The sender constructs them to load or insert a list of media items on the
 * receiver application. The @link GCKMediaStatus @endlink from the receiver also contains the list
 * of items represented as instances of this class.
 * <p>
 * Once loaded, the receiver will assign a unique item ID to each GCKMediaQueueItem, even if the
 * same media gets loaded multiple times.
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKMediaQueueItem : NSObject<NSCopying>

/** The media information associated with this item. */
@property(nonatomic, strong, readonly) GCKMediaInformation *mediaInformation;

/** The item ID, or kGCKMediaQueueInvalidItemID if one has not yet been assigned. */
@property(nonatomic, readonly) NSUInteger itemID;

/**
 * Whether the item should automatically start playback when it becomes the current item in the
 * queue. If <code>NO</code>, the queue will pause when it reaches this item. The default value is
 * <code>YES</code>.
 */
@property(nonatomic, readonly) BOOL autoplay;

/**
 * The start time of the item, in seconds. The default value is <code>kInvalidTimeInterval</code>,
 * indicating that no start time has been set.
 */
@property(nonatomic, readonly) NSTimeInterval startTime;

/**
 * The playback duration for the item, in seconds, or <code>INFINITY</code> if the stream's actual
 * duration should be used.
 */
@property(nonatomic, readonly) NSTimeInterval playbackDuration;

/**
 * How long before the previous item ends, in seconds, before the receiver should start
 * preloading this item. The default value is <code>kInvalidTimeInterval</code>, indicating that no
 * preload time has been set.
 */
@property(nonatomic, readonly) NSTimeInterval preloadTime;

/** The active track IDs for this item. */
@property(nonatomic, strong, readonly) NSArray *activeTrackIDs;

/** The custom data associated with this item, if any. */
@property(nonatomic, strong, readonly) id customData;

/**
 * Constructs a new GCKMediaQueueItem with the given attributes. See the documentation of the
 * corresponding properties for more information.
 *
 * @param mediaInformation The media information for the item.
 * @param autoplay The autoplay state for this item.
 * @param startTime The start time of the item, in seconds. May be
 * <code>kInvalidTimeInterval</code> if this item refers to a live stream or if the default start
 * time should be used.
 * @param preloadTime The preload time for the item, in seconds. May be
 * <code>kInvalidTimeInterval</code> to indicate no preload time.
 * @param activeTrackIDs The active track IDs for the item. May be <code>nil</code>.
 * @param customData Any custom data to associate with the item. May be <code>nil</code>.
 */
- (instancetype)initWithMediaInformation:(GCKMediaInformation *)mediaInformation
                                autoplay:(BOOL)autoplay
                               startTime:(NSTimeInterval)startTime
                             preloadTime:(NSTimeInterval)preloadTime
                          activeTrackIDs:(NSArray *)activeTrackIDs
                              customData:(id)customData;

/**
 * Designated initializer. Constructs a new GCKMediaQueueItem with the given attributes. See the
 * documentation of the corresponding properties for more information.
 *
 * @param mediaInformation The media information for the item.
 * @param autoplay The autoplay state for this item.
 * @param startTime The start time of the item, in seconds. May be
 * <code>kInvalidTimeInterval</code> if this item refers to a live stream or if the default start
 * time should be used.
 * @param playbackDuration The playback duration of the item, in seconds. May be
 * <code>kInvalidTimeInterval</code> to indicate no preload time.
 * @param preloadTime The preload time for the item, in seconds.
 * @param activeTrackIDs The active track IDs for the item. May be <code>nil</code>.
 * @param customData Any custom data to associate with the item. May be <code>nil</code>.
 */
- (instancetype)initWithMediaInformation:(GCKMediaInformation *)mediaInformation
                                autoplay:(BOOL)autoplay
                               startTime:(NSTimeInterval)startTime
                        playbackDuration:(NSTimeInterval)playbackDuration
                             preloadTime:(NSTimeInterval)preloadTime
                          activeTrackIDs:(NSArray *)activeTrackIDs
                              customData:(id)customData /*NS_DESIGNATED_INITIALIZER*/;

/**
 * Clears (unassigns) the item ID. Should be called in order to reuse an existing instance, for
 * example, to add it back to a queue.
 */
- (void)clearItemID;

/**
 * Returns a copy of this GCKMediaQueueItem that has been modified by the given block.
 *
 * @param block A block that receives a GCKMediaQueueItemBuilder which can be used to modify
 * attributes of the copy. It is not necessary to call the builder's -[build] method within the
 * block, as this method will do that automatically when the block completes.
 * @return A modified copy of this item.
 */
- (instancetype)mediaQueueItemModifiedWithBlock:(void (^)(GCKMediaQueueItemBuilder *builder))block;

@end

@interface GCKMediaQueueItemBuilder : NSObject

/** The media information associated with this item. */
@property(nonatomic, copy, readwrite) GCKMediaInformation *mediaInformation;

/**
 * Whether the item should automatically start playback when it becomes the current item in the
 * queue. If <code>NO</code>, the queue will pause when it reaches this item. The default value is
 * <code>YES</code>.
 */
@property(nonatomic, readwrite) BOOL autoplay;

/**
 * The start time of the item, in seconds. The default value is <code>kInvalidTimeInterval</code>,
 * indicating that a start time does not apply (e.g., for a live stream) or that the default start
 * time should be used.
 */
@property(nonatomic, readwrite) NSTimeInterval startTime;

/**
 * The playback duration for the item, in seconds, or <code>INFINITY</code> if the stream's actual
 * duration should be used.
 */
@property(nonatomic, readwrite) NSTimeInterval playbackDuration;

/**
 * How long before the previous item ends, in seconds, before the receiver should start
 * preloading this item. The default value is <code>kInvalidTimeInterval</code>, indicating no
 * preload time.
 */
@property(nonatomic, readwrite) NSTimeInterval preloadTime;

/** The active track IDs for this item. */
@property(nonatomic, copy, readwrite) NSArray *activeTrackIDs;

/** The custom data associated with this item, if any. */
@property(nonatomic, copy, readwrite) id customData;

/**
 * Constructs a new GCKMediaQueueItemBuilder with attributes initialized to default values.
 */
- (instancetype)init;

/**
 * Constructs a new GCKMediaQueueItemBuilder with attributes copied from the given
 * GCKMediaQueueItem, including the item ID.
 *
 * @param item The item to copy.
 */
- (instancetype)initWithMediaQueueItem:(GCKMediaQueueItem *)item;

/**
 * Builds a GCKMediaQueueItem using the builder's current attributes.
 */
- (GCKMediaQueueItem *)build;

@end
