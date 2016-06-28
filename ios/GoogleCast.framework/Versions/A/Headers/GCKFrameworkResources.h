// Copyright 2015 Google Inc.

#import <Foundation/Foundation.h>

#if TARGET_OS_IPHONE
#import <UIKit/UIKit.h>
#endif

#import <GoogleCast/GCKDefines.h>

/**
 * A singleton object that provides access to the GoogleCast framework's resource bundle.
 */
GCK_EXPORT
@interface GCKFrameworkResources : NSObject

/** Returns the singleton instance. */
+ (instancetype)sharedInstance;

/** The framework's resource bundle. */
@property(nonatomic, readonly) NSBundle *bundle;

#if TARGET_OS_IPHONE

/**
 * Loads and returns the framework image resource with the given filename.
 *
 * @param name The name of the resource.
 * @return The image.
 */
- (UIImage *)imageNamed:(NSString *)name;

/**
 * Loads and returns the framework image resource with the given filename and rendering mode.
 *
 * @param name The name of the resource.
 * @param renderingMode The image rendering mode.
 * @return The image.
 */
- (UIImage *)imageNamed:(NSString *)name
      withRenderingMode:(UIImageRenderingMode)renderingMode;

/**
 * Loads and returns the storyboard resource with the given filename.
 *
 * @param name The name of the resource.
 */
- (UIStoryboard *)storyboardNamed:(NSString *)name;

#endif  // TARGET_OS_IPHONE

/**
 * Loads and returns the framework Nib resource with the given filename.
 *
 * @param name The name of the resource.
 * @param owner The object that will own the Nib.
 * @param replacementObjects Replacement objects for the Nib. May be nil if none are required.
 */
- (NSArray *)nibNamed:(NSString *)name
                owner:(id)owner
   replacementObjects:(NSDictionary *)objects;

@end
