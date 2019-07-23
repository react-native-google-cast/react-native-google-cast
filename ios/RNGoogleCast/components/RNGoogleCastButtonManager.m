#import "RNGoogleCastButton.h"
#import <React/RCTViewManager.h>

@interface RNGoogleCastButtonManager : RCTViewManager
@end

@implementation RNGoogleCastButtonManager

RCT_EXPORT_MODULE()

- (UIView *)view {
  return [[RNGoogleCastButton alloc] init];
}

RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

@end
