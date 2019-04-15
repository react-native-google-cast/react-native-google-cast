#import <GoogleCast/GoogleCast.h>
#import <React/RCTViewManager.h>

@interface RNGoogleCastButtonManager : RCTViewManager
@end

@implementation RNGoogleCastButtonManager

RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

RCT_EXPORT_MODULE()

- (UIView *)view {
  GCKUICastButton *castButton = [[GCKUICastButton alloc] init];
  castButton.tintColor = [UIColor colorWithRed:60.0 / 255.0 green:60.0 / 255.0 blue:59.0 / 255.0 alpha:1];
  return castButton;
}

@end
