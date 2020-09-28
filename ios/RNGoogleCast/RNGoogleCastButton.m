#import <GoogleCast/GoogleCast.h>
#import "RNGoogleCastButton.h"

@implementation RNGoogleCastButton
{
  GCKUICastButton *_castButton;
  UIColor *_tintColor;
}

-(void)layoutSubviews {
  _castButton = [[GCKUICastButton alloc] initWithFrame:self.bounds];
  _castButton.tintColor = _tintColor;
  [self addSubview:_castButton];
}

-(void)setTintColor:(UIColor *)color {
  super.tintColor = _tintColor = _castButton.tintColor = color;
  [self setNeedsDisplay];
}

@end
