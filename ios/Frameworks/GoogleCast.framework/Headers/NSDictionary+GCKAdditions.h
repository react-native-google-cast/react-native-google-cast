// Copyright 2012 Google Inc.

#import <Foundation/Foundation.h>

#import <GoogleCast/GCKDefines.h>

/**
 * A category that adds some convenience methods to NSDictionary for setting and safely looking up
 * values of various types. These methods are particularly useful for getting and setting fields of
 * JSON data objects.
 *
 * @ingroup Utilities
 */
@interface NSDictionary (GCKAdditions)

/**
 * Looks up an NSString value for a key, with a given fallback value.
 *
 * @param key The key.
 * @param defaultValue The default value to return if the key is not found or if its value is not
 * an NSString.
 * @return The value of the key, if it was found and was an NSString; otherwise the default value.
 */
- (NSString *)gck_stringForKey:(NSString *)key withDefaultValue:(NSString *)defaultValue;

/**
 * Looks up an NSString value for a key, with a fallback value of <code>nil</code>.
 *
 * @param key The key.
 * @return The value of the key, if found it was found and was an NSString; otherwise
 * <code>nil</code>.
 */
- (NSString *)gck_stringForKey:(NSString *)key;

/**
 * Looks up an NSInteger value for a key, with a given fallback value.
 *
 * @param key The key.
 * @param defaultValue The default value to return if the key is not found or if its value is not
 * an NSNumber.
 * @return The value of the key, if it was found and was an NSNumber; otherwise the default value.
 */
- (NSInteger)gck_integerForKey:(NSString *)key withDefaultValue:(NSInteger)defaultValue;

/**
 * Looks up an NSUInteger value for a key, with a given fallback value.
 *
 * @param key The key.
 * @param defaultValue The default value to return if the key is not found or if its value is not
 * an NSNumber.
 * @return The value of the key, if it was found and was an NSNumber; otherwise the default value.
 */
- (NSUInteger)gck_uintegerForKey:(NSString *)key withDefaultValue:(NSUInteger)defaultValue;

/**
 * Looks up an NSInteger value for a key, with a fallback value of <code>0</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSNumber; otherwise <code>0</code>.
 */
- (NSInteger)gck_integerForKey:(NSString *)key;

/**
 * Looks up an NSUInteger value for a key, with a fallback value of <code>0</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSNumber; otherwise <code>0</code>.
 */
- (NSUInteger)gck_uintegerForKey:(NSString *)key;

/**
 * Looks up a double value for a key, with a given fallback value.
 *
 * @param key The key.
 * @param defaultValue The default value to return if the key is not found or if its value is not
 * an NSNumber.
 * @return The value of the key, if it was found and was an NSNumber; otherwise the default value.
 */
- (double)gck_doubleForKey:(NSString *)key withDefaultValue:(double)defaultValue;

/**
 * Looks up a double value for a key, with a fallback value of <code>0.0</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSNumber; otherwise <code>0.0</code>.
 */
- (double)gck_doubleForKey:(NSString *)key;

/**
 * Looks up a BOOL value for a key, with a given fallback value.
 *
 * @param key The key.
 * @param defaultValue The default value to return if the key is not found or if its value is not
 * an NSNumber.
 * @return The value of the key, if it was found and was an NSNumber; otherwise the default value.
 */
- (BOOL)gck_boolForKey:(NSString *)key withDefaultValue:(BOOL)defaultValue;

/**
 * Looks up a BOOL value for a key, with a fallback value of <code>NO</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSNumber; otherwise <code>NO</code>.
 */
- (BOOL)gck_boolForKey:(NSString *)key;

/**
 * Looks up an NSDictionary value for a key, with a fallback value of <code>nil</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSDictionary; otherwise
 * <code>nil</code>.
 */
- (NSDictionary *)gck_dictionaryForKey:(NSString *)key;

/**
 * Looks up an NSArray value for a key, with a fallback value of <code>nil</code>.
 *
 * @param key The key.
 * @return The value of the key, if it was found and was an NSArray; otherwise
 * <code>nil</code>.
 */
- (NSArray *)gck_arrayForKey:(NSString *)key;

/**
 * Sets an NSString value for a key.
 *
 * @param value The value.
 * @param key The key.
 */
- (void)gck_setStringValue:(NSString *)value forKey:(NSString *)key;

/**
 * Sets an NSInteger value for a key.
 *
 * @param value The value.
 * @param key The key.
 */
- (void)gck_setIntegerValue:(NSInteger)value forKey:(NSString *)key;

/**
 * Sets an NSUInteger value for a key.
 *
 * @param value The value.
 * @param key The key.
 */
- (void)gck_setUIntegerValue:(NSUInteger)value forKey:(NSString *)key;

/**
 * Sets a double value for a key.
 *
 * @param value The value.
 * @param key The key.
 */
- (void)gck_setDoubleValue:(double)value forKey:(NSString *)key;

/**
 * Sets a BOOL value for a key.
 *
 * @param value The value.
 * @param key The key.
 */
- (void)gck_setBoolValue:(BOOL)value forKey:(NSString *)key;

@end

// For backwards compatibility:
#ifndef GCKTypedValueLookup
#define GCKTypedValueLookup GCKAdditions
#endif
