// Copyright 2013 Google Inc.

#import <Foundation/Foundation.h>

#import <stdarg.h>

#import <GoogleCast/GCKDefines.h>

@protocol GCKLoggerDelegate;

/**
 * A singleton object used for logging by the framework. If a delegate is assigned, the formatted
 * log messages are passed to the delegate. Otherwise, the messages are written using NSLog() in
 * debug builds and are discarded otherwise.
 *
 * @ingroup Utilities
 */
GCK_EXPORT
@interface GCKLogger : NSObject

/** The delegate to pass log messages to. */
@property(nonatomic, weak) id<GCKLoggerDelegate> delegate;

/**
 * Returns the GCKLogger singleton instance.
 */
+ (GCKLogger *)sharedInstance;

/**
 * Logs a message.
 *
 * @param function The calling function, normally <code>__func__</code>.
 * @param format The format string.
 */
- (void)logFromFunction:(const char *)function message:(NSString *)format, ...
    NS_FORMAT_FUNCTION(2, 3);

@end

/**
 * The GCKLogger delegate interface.
 *
 * @ingroup Utilities
 */
GCK_EXPORT
@protocol GCKLoggerDelegate

/**
 * Logs a message.
 *
 * @param function The calling function, normally <code>__func__</code>.
 * @param message The log message.
 */
- (void)logFromFunction:(const char *)function message:(NSString *)message;

@end

/**
 * @macro GCKLog
 *
 * A convenience macro for logging to the GCKLogger singleton. This is a drop-in replacement
 * for NSLog().
 */
#define GCKLog(FORMAT, ...) \
    [[GCKLogger sharedInstance] logFromFunction:__func__ message:FORMAT, ##__VA_ARGS__]
