// Copyright 2014 Google Inc.

#import <GoogleCast/GCKDefines.h>

@class GCKColor;

/**
 * Edge type.
 *
 * @ingroup MediaControl
 */
typedef NS_ENUM(NSInteger, GCKMediaTextTrackStyleEdgeType) {
  /** Unknown. */
  GCKMediaTextTrackStyleEdgeTypeUnknown = -1,
  /** None. */
  GCKMediaTextTrackStyleEdgeTypeNone = 0,
  /** Outline. */
  GCKMediaTextTrackStyleEdgeTypeOutline = 1,
  /** Drop shadow. */
  GCKMediaTextTrackStyleEdgeTypeDropShadow = 2,
  /** Raised. */
  GCKMediaTextTrackStyleEdgeTypeRaised = 3,
  /** Depressed. */
  GCKMediaTextTrackStyleEdgeTypeDepressed = 4,
};

/**
 * Window type.
 *
 * @ingroup MediaControl
 */
typedef NS_ENUM(NSInteger, GCKMediaTextTrackStyleWindowType) {
  /** Unknown. */
  GCKMediaTextTrackStyleWindowTypeUnknown = -1,
  /** None. */
  GCKMediaTextTrackStyleWindowTypeNone = 0,
  /** Normal. */
  GCKMediaTextTrackStyleWindowTypeNormal = 1,
  /** Rounded corners. */
  GCKMediaTextTrackStyleWindowTypeRoundedCorners = 2,
};

/**
 * Generic font family.
 *
 * @ingroup MediaControl
 */
typedef NS_ENUM(NSInteger, GCKMediaTextTrackStyleFontGenericFamily) {
  /** Unknown. */
  GCKMediaTextTrackStyleFontGenericFamilyUnknown = -1,
  /** None. */
  GCKMediaTextTrackStyleFontGenericFamilyNone = 0,
  /** Sans serif. */
  GCKMediaTextTrackStyleFontGenericFamilySansSerif = 1,
  /** Monospaced sans serif. */
  GCKMediaTextTrackStyleFontGenericFamilyMonospacedSansSerif = 2,
  /** Serif. */
  GCKMediaTextTrackStyleFontGenericFamilySerif = 3,
  /** Monospaced serif. */
  GCKMediaTextTrackStyleFontGenericFamilyMonospacedSerif = 4,
  /** Casual. */
  GCKMediaTextTrackStyleFontGenericFamilyCasual = 5,
  /** Cursive. */
  GCKMediaTextTrackStyleFontGenericFamilyCursive = 6,
  /** Small Capitals. */
  GCKMediaTextTrackStyleFontGenericFamilySmallCapitals = 7,
};

/**
 * Font style.
 *
 * @ingroup MediaControl
 */
typedef NS_ENUM(NSInteger, GCKMediaTextTrackStyleFontStyle) {
  /** Unknown. */
  GCKMediaTextTrackStyleFontStyleUnknown = -1,
  /** Normal. */
  GCKMediaTextTrackStyleFontStyleNormal = 0,
  /** Bold. */
  GCKMediaTextTrackStyleFontStyleBold = 1,
  /** Italic. */
  GCKMediaTextTrackStyleFontStyleItalic = 2,
  /** Bold italic. */
  GCKMediaTextTrackStyleFontStyleBoldItalic = 3,
};

/**
 * A class representing a style for a text media track.
 *
 * @ingroup MediaControl
 */
GCK_EXPORT
@interface GCKMediaTextTrackStyle : NSObject<NSCopying>

/**
 * Designated initializer. All properties are mutable and so can be supplied after construction.
 */
- (instancetype)init;

/**
 * Create an instance with default values based on the system's closed captioning settings. This
 * method will return nil on systems older than iOS 7.
 */
+ (instancetype)createDefault;

/** The font scaling factor for the text. */
@property(nonatomic) CGFloat fontScale;

/** The foreground color. */
@property(nonatomic, copy) GCKColor *foregroundColor;

/** The background color. */
@property(nonatomic, copy) GCKColor *backgroundColor;

/** The edge type. */
@property(nonatomic) GCKMediaTextTrackStyleEdgeType edgeType;

/** The edge color. */
@property(nonatomic, copy) GCKColor *edgeColor;

/** The window type. */
@property(nonatomic) GCKMediaTextTrackStyleWindowType windowType;

/** The window color. */
@property(nonatomic, copy) GCKColor *windowColor;

/** Rounded corner radius absolute value in pixels. */
@property(nonatomic) CGFloat windowRoundedCornerRadius;

/** The font family; if the font is not available, the generic font family will be used. **/
@property(nonatomic, copy) NSString *fontFamily;

/** The generic font family. */
@property(nonatomic) GCKMediaTextTrackStyleFontGenericFamily fontGenericFamily;

/** The font style. */
@property(nonatomic) GCKMediaTextTrackStyleFontStyle fontStyle;

/** The custom data, if any. */
@property(nonatomic, strong) id customData;

@end
