#import "ObjCExceptionCatcher.h"

@implementation ObjCExceptionCatcher

+ (BOOL)catchExceptions:(NS_NOESCAPE void (^)(void))block error:(__autoreleasing NSError *_Nullable *_Nullable)error {
  @try {
    block();
    return YES;
  } @catch (NSException *exception) {
    if (error) {
      NSMutableDictionary *userInfo = [NSMutableDictionary dictionary];
      if (exception.reason) {
        userInfo[NSLocalizedDescriptionKey] = exception.reason;
      }
      userInfo[@"name"] = exception.name;
      *error = [NSError errorWithDomain:@"ObjCExceptionCatcher" code:0 userInfo:userInfo];
    }
    return NO;
  }
}

@end
