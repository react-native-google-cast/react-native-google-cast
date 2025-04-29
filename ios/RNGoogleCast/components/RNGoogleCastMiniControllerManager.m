#import "RNGoogleCastMiniControllerManager.h"
#import "RNGoogleCastMiniController.h"

@implementation RNGoogleCastMiniControllerManager

RCT_EXPORT_MODULE()

- (UIView *)view {
    return [[RNGoogleCastMiniController alloc] init];
}

@end
