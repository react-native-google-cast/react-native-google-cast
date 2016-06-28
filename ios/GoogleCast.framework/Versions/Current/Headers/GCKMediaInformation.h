// Copyright 2013 Google Inc.

#import <GoogleCast/GCKDefines.h>

@class GCKMediaMetadata;
@class GCKMediaTextTrackStyle;

/**
 * @file GCKMediaInformation.h
 * GCKMediaStreamType enum.
 */

/**
 * @enum GCKMediaStreamType
 * Enum defining the media stream type.
 */
typedef NS_ENUM(NSInteger, GCKMediaStreamType) {
  /** A stream type of "none". */
  GCKMediaStreamTypeNone = 0,
  /** A buffered stream type. */
  GCKMediaStreamTypeBuffered = 1,
  /** A live stream type. */
  GCKMediaStreamTypeLive = 2,
  /** An unknown stream type. */
  GCKMediaStreamTypeUnknown = 99,
};

/**
 * A class that aggregates information about a media item.
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKMediaInformation : NSObject<NSCopying>

/**
 * The content ID for this stream.
 */
@property(nonatomic, copy, readonly) NSString *contentID;

/**
 * The stream type.
 */
@property(nonatomic, readonly) GCKMediaStreamType streamType;

/**
 * The content (MIME) type.
 */
@property(nonatomic, copy, readonly) NSString *contentType;

/**
 * The media item metadata.
 */
@property(nonatomic, strong, readonly) GCKMediaMetadata *metadata;

/**
 * The length of the stream, in seconds, or <code>INFINITY</code> if it is a live stream.
 */
@property(nonatomic, readonly) NSTimeInterval streamDuration;

/**
 * The media tracks for this stream.
 */
@property(nonatomic, copy, readonly) NSArray *mediaTracks;

/**
 * The text track style for this stream.
 */
@property(nonatomic, copy, readonly) GCKMediaTextTrackStyle *textTrackStyle;

/**
 * The custom data, if any.
 */
@property(nonatomic, strong, readonly) id customData;

/**
 * Designated initializer.
 *
 * @param contentID The content ID.
 * @param streamType The stream type.
 * @param contentType The content (MIME) type.
 * @param metadata The media item metadata.
 * @param streamDuration The stream duration.
 * @param mediaTracks The media tracks, if any, otherwise <code>nil</code>.
 * @param textTrackStyle The text track style, if any, otherwise <code>nil</code>.
 * @param customData The custom application-specific data.
 */
- (instancetype)initWithContentID:(NSString *)contentID
                       streamType:(GCKMediaStreamType)streamType
                      contentType:(NSString *)contentType
                         metadata:(GCKMediaMetadata *)metadata
                   streamDuration:(NSTimeInterval)streamDuration
                      mediaTracks:(NSArray *)mediaTracks
                   textTrackStyle:(GCKMediaTextTrackStyle *)textTrackStyle
                       customData:(id)customData;

/**
 * Legacy initializer; does not include media tracks or text track style.
 *
 * @param contentID The content ID.
 * @param streamType The stream type.
 * @param contentType The content (MIME) type.
 * @param metadata The media item metadata.
 * @param streamDuration The stream duration.
 * @param customData Custom application-specific data. Must either be an object that can be
 * serialized to JSON using NSJSONSerialization, or nil.
 */
- (instancetype)initWithContentID:(NSString *)contentID
                       streamType:(GCKMediaStreamType)streamType
                      contentType:(NSString *)contentType
                         metadata:(GCKMediaMetadata *)metadata
                   streamDuration:(NSTimeInterval)streamDuration
                       customData:(id)customData;

@end
