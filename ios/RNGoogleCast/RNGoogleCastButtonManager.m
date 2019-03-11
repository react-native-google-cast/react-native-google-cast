#import <GoogleCast/GoogleCast.h>
#import <React/RCTViewManager.h>

@interface RNGoogleCastButtonManager : RCTViewManager
@end

@implementation RNGoogleCastButtonManager

RCT_EXPORT_VIEW_PROPERTY(tintColor, UIColor)

RCT_EXPORT_MODULE()

- (UIView *)view {
  GCKUICastButton *castButton = [[GCKUICastButton alloc] init];
  castButton.tintColor = [UIColor whiteColor];
  return castButton;
}

@end
