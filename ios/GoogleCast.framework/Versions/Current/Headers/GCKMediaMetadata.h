// Copyright 2013 Google Inc.

#import <GoogleCast/GCKDefines.h>

@class GCKImage;

/**
 * @file GCKMediaMetadata.h
 * GCKMediaMetadataType enum.
 */

/**
 * @enum GCKMediaMetadataType
 * Enum defining the media metadata types.
 */
typedef NS_ENUM(NSInteger, GCKMediaMetadataType) {
  /**
   * A media type representing generic media content.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypeGeneric = 0,

  /**
   * A media type representing a movie.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypeMovie = 1,

  /**
   * A media type representing an TV show.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypeTVShow = 2,

  /**
   * A media type representing a music track.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypeMusicTrack = 3,

  /**
   * A media type representing a photo.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypePhoto = 4,

  /**
   * The smallest media type value that can be assigned for application-defined media types.
   *
   * @memberof GCKMediaMetadata
   */
  GCKMediaMetadataTypeUser = 100,
};

/**
 * String key: Creation date.
 * <p>
 * The value is the date and/or time at which the media was created, in ISO-8601 format.
 * For example, this could be the date and time at which a photograph was taken or a piece of
 * music was recorded.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyCreationDate;

/**
 * String key: Release date.
 * <p>
 * The value is the date and/or time at which the media was released, in ISO-8601 format.
 * For example, this could be the date that a movie or music album was released.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyReleaseDate;

/**
 * String key: Broadcast date.
 * <p>
 * The value is the date and/or time at which the media was first broadcast, in ISO-8601 format.
 * For example, this could be the date that a TV show episode was first aired.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyBroadcastDate;

/**
 * String key: Title.
 * <p>
 * The title of the media. For example, this could be the title of a song, movie, or TV show
 * episode. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyTitle;

/**
 * String key: Subtitle.
 * <p>
 * The subtitle of the media. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeySubtitle;

/**
 * String key: Artist.
 * <p>
 * The name of the artist who created the media. For example, this could be the name of a
 * musician, performer, or photographer. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyArtist;

/**
 * String key: Album artist.
 * <p>
 * The name of the artist who produced an album. For example, in compilation albums such as DJ
 * mixes, the album artist is not necessarily the same as the artist(s) of the individual songs
 * on the album. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyAlbumArtist;

/**
 * String key: Album title.
 * <p>
 * The title of the album that a music track belongs to. This value is suitable for display
 * purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyAlbumTitle;

/**
 * String key: Composer.
 * <p>
 * The name of the composer of a music track. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyComposer;

/**
 * Integer key: Disc number.
 * <p>
 * The disc number (counting from 1) that a music track belongs to in a multi-disc album.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyDiscNumber;

/**
 * Integer key: Track number.
 * <p>
 * The track number of a music track on an album disc. Typically track numbers are counted
 * starting from 1, however this value may be 0 if it is a "hidden track" at the beginning of
 * an album.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyTrackNumber;

/**
 * Integer key: Season number.
 * <p>
 * The season number that a TV show episode belongs to. Typically season numbers are counted
 * starting from 1, however this value may be 0 if it is a "pilot" episode that predates the
 * official start of a TV series.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeySeasonNumber;

/**
 * Integer key: Episode number.
 * <p>
 * The number of an episode in a given season of a TV show. Typically episode numbers are
 * counted starting from 1, however this value may be 0 if it is a "pilot" episode that is not
 * considered to be an official episode of the first season.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyEpisodeNumber;

/**
 * String key: Series title.
 * <p>
 * The name of a series. For example, this could be the name of a TV show or series of related
 * music albums. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeySeriesTitle;

/**
 * String key: Studio.
 * <p>
 * The name of a recording studio that produced a piece of media. For example, this could be
 * the name of a movie studio or music label. This value is suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyStudio;

/**
 * Integer key: Width.
 *
 * The width of a piece of media, in pixels. This would typically be used for providing the
 * dimensions of a photograph.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyWidth;

/**
 * Integer key: Height.
 *
 * The height of a piece of media, in pixels. This would typically be used for providing the
 * dimensions of a photograph.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyHeight;

/**
 * String key: Location name.
 * <p>
 * The name of a location where a piece of media was created. For example, this could be the
 * location of a photograph or the principal filming location of a movie. This value is
 * suitable for display purposes.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyLocationName;

/**
 * Double key: Location latitude.
 * <p>
 * The latitude component of the geographical location where a piece of media was created.
 * For example, this could be the location of a photograph or the principal filming location of
 * a movie.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyLocationLatitude;

/**
 * Double key: Location longitude.
 * <p>
 * The longitude component of the geographical location where a piece of media was created.
 * For example, this could be the location of a photograph or the principal filming location of
 * a movie.
 *
 * @memberof GCKMediaMetadata
 */
GCK_EXTERN NSString *const kGCKMetadataKeyLocationLongitude;

/**
 * Container class for media metadata. Metadata has a media type, an optional
 * list of images, and a collection of metadata fields. Keys for common
 * metadata fields are predefined as constants, but the application is free to
 * define and use additional fields of its own.
 * <p>
 * The values of the predefined fields have predefined types. For example, a track number is
 * an <code>NSInteger</code> and a creation date is a <code>NSString</code> containing an ISO-8601
 * representation of a date and time. Attempting to store a value of an incorrect type in a field
 * will assert.
 * <p>
 * Note that the Cast protocol limits which metadata fields can be used for a given media type.
 * When a MediaMetadata object is serialized to JSON for delivery to a Cast receiver, any
 * predefined fields which are not supported for a given media type will not be included in the
 * serialized form, but any application-defined fields will always be included.
 * The complete list of predefined fields is as follows:
 * <p>
 * <table>
 *   <tr>
 *     <th>Field</th>
 *     <th>Value Type</th>
 *     <th>Valid Metadata Types</th>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyCreationDate}</td>
 *     <td>NSDate</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyReleaseDate}</td>
 *     <td>NSDate</td>
 *     <td>{@link GCKMediaMetadataTypeGeneric}, {@link GCKMediaMetadataTypeMovie},
 *         {@link GCKMediaMetadataTypeTVShow}, {@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyBroadcastDate}</td>
 *     <td>NSDate</td>
 *     <td>{@link GCKMediaMetadataTypeTVShow}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyTitle}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeGeneric}, {@link GCKMediaMetadataTypeMovie},
 *         {@link GCKMediaMetadataTypeTVShow}, {@link GCKMediaMetadataTypeMusicTrack},
 *         {@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeySubtitle}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeGeneric}, {@link GCKMediaMetadataTypeMovie}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyArtist}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeGeneric}, {@link GCKMediaMetadataTypeMusicTrack},
 *         {@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyAlbumArtist}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyAlbumTitle}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyComposer}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyDiscNumber}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyTrackNumber}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypeMusicTrack}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeySeasonNumber}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypeTVShow}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyEpisodeNumber}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypeTVShow}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeySeriesTitle}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeTVShow}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyStudio}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypeMovie}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyWidth}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyHeight}</td>
 *     <td>NSInteger</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyLocationName}</td>
 *     <td>NSString</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyLocationLatitude}</td>
 *     <td>double</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 *   <tr>
 *     <td>{@link kGCKMetadataKeyLocationLongitude}</td>
 *     <td>double</td>
 *     <td>{@link GCKMediaMetadataTypePhoto}</td>
 *   </tr>
 * </table>
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKMediaMetadata : NSObject<NSCopying>

@property(nonatomic, readonly) GCKMediaMetadataType metadataType;

/**
 * Initializes a new, empty, MediaMetadata with the given media type.
 * Designated initializer.
 *
 * @param metadataType The media type; one of the {@code GCKMediaMetadataType*} constants, or a
 * value greater than or equal to {@link GCKMediaMetadataTypeUser} for custom media types.
 */
- (instancetype)initWithMetadataType:(GCKMediaMetadataType)metadataType;

/**
 * Initialize with the generic metadata type.
 */
- (instancetype)init;

/**
 * The metadata type.
 */
- (GCKMediaMetadataType)metadataType;

/**
 * Gets the list of images.
 */
- (NSArray *)images;

/**
 * Removes all the current images.
 */
- (void)removeAllMediaImages;

/**
 * Adds an image to the list of images.
 *
 * @param image The image to add.
 */
- (void)addImage:(GCKImage *)image;

/**
 * Tests if the object contains a field with the given key.
 *
 * @param key The key.
 */
- (BOOL)containsKey:(NSString *)key;

/**
 * Returns a set of keys for all fields that are present in the object.
 */
- (NSArray *)allKeys;

/**
 * Reads the value of a field.
 *
 * @param key The key for the field.
 * @return The value of the field, or {@code nil} if the field has not been set.
 */
- (id)objectForKey:(NSString *)key;

/**
 * Stores a value in a string field. Asserts if the key refers to a predefined field which is not a
 * {@code NSString} field.
 *
 * @param value The new value for the field.
 * @param key The key for the field.
 */
- (void)setString:(NSString *)value forKey:(NSString *)key;

/**
 * Reads the value of a string field. Asserts if the key refers to a predefined field which is not
 * a {@code NSString} field.
 *
 * @param key The key for the field.
 * @return The value of the field, or {@code nil} if the field has not been set.
 */
- (NSString *)stringForKey:(NSString *)key;

/**
 * Stores a value in an integer field. Asserts if the key refers to a predefined field which is
 * not an {@code NSInteger} field.
 *
 * @param value The new value for the field.
 * @param key The key for the field.
 */
- (void)setInteger:(NSInteger)value forKey:(NSString *)key;

/**
 * Reads the value of an integer field. Asserts if the key refers to a predefined field which is
 * not an {@code NSInteger} field.
 *
 * @param key The key for the field.
 * @return The value of the field, or 0 if the field has not been set.
 */
- (NSInteger)integerForKey:(NSString *)key;

/**
 * Reads the value of an integer field. Asserts if the key refers to a predefined field which is
 * not an {@code NSInteger} field.
 *
 * @param key The key for the field.
 * @param defaultValue The value to return if the field has not been set.
 * @return The value of the field, or the given default value if the field has not been set.
 */
- (NSInteger)integerForKey:(NSString *)key defaultValue:(NSInteger)defaultValue;

/**
 * Stores a value in a {@code double} field. Asserts if the key refers to a predefined field
 * which is not a {@code double} field.
 *
 * @param value The new value for the field.
 * @param key The key for the field.
 */
- (void)setDouble:(double)value forKey:(NSString *)key;

/**
 * Reads the value of a {@code double} field. Asserts if the key refers to a predefined field
 * which is not a {@code double} field.
 *
 * @param key The key for the field.
 * @return The value of the field, or 0 if the field has not been set.
 */
- (double)doubleForKey:(NSString *)key;

/**
 * Reads the value of a {@code double} field. Asserts if the key refers to a predefined field
 * which is not a {@code double} field.
 *
 * @param defaultValue The value to return if the field has not been set.
 * @param key The key for the field.
 * @return The value of the field, or the given default value if the field has not been set.
 */
- (double)doubleForKey:(NSString *)key defaultValue:(double)defaultValue;

/**
 * Stores a value in a date field as a restricted ISO-8601 representation of the date. Asserts if
 * the key refers to a predefined field which is not a date field.
 *
 * @param date The new value for the field.
 * @param key The key for the field.
 */
- (void)setDate:(NSDate *)date forKey:(NSString *)key;

/**
 * Reads the value of a date field from the restricted ISO-8601 representation of the date.
 * Asserts if the key refers to a predefined field which is not a date field.
 *
 * @param key The field name.
 * @return The date, or {@code nil} if this field has not been set.
 */
- (NSDate *)dateForKey:(NSString *)key;

/**
 * Reads the value of a date field, as a string. Asserts if the key refers to a predefined field
 * which is not a date field.
 *
 * @param key The field name.
 * @return The date, as a {@code String} containing the restricted ISO-8601 representation of the
 * date, or {@code null} if this field has not been set.
 * @throw IllegalArgumentException If the specified field's predefined type is not a date.
 */
- (NSString *)dateAsStringForKey:(NSString *)key;

@end
