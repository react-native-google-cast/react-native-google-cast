#import <GoogleCast/GoogleCast.h>
#import <React/RCTViewManager.h>

@interface RNGoogleCastButtonManager : RCTViewManager
@end

@implementation RNGoogleCastButtonManager

//RCT_EXPORT_VIEW_PROPERTY(triggersDefaultCastDialog, BOOL)

RCT_EXPORT_MODULE()

- (UIView *)view {
  GCKUICastButton *castButton = [[GCKUICastButton alloc] init];
  return castButton;
}

@end
