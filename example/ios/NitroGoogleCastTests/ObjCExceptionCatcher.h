#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

/// Bridges Objective-C `NSException` into a Swift-catchable `NSError`.
///
/// Google Cast APIs (e.g. `GCKImage` with invalid dimensions, or `GCKMediaMetadata`
/// setters used with the wrong field type) raise `NSException`, which Swift `do/catch`
/// cannot intercept. The converter parity tests use this to probe and assert that
/// behaviour without crashing the whole test runner.
@interface ObjCExceptionCatcher : NSObject

+ (BOOL)catchExceptions:(NS_NOESCAPE void (^)(void))block error:(__autoreleasing NSError *_Nullable *_Nullable)error;

@end

NS_ASSUME_NONNULL_END
