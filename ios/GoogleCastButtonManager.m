#import <GoogleCast/GoogleCast.h>
#import <React/RCTViewManager.h>

@interface GoogleCastButtonManager : RCTViewManager
@end

@implementation GoogleCastButtonManager

RCT_EXPORT_VIEW_PROPERTY(triggersDefaultCastDialog, BOOL)

RCT_EXPORT_MODULE()

- (UIView *)view {
  GCKUICastButton *castButton = [[GCKUICastButton alloc] init];
  return castButton;
}

@end
