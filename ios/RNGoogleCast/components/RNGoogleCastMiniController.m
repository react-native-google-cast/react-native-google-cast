#import "RNGoogleCastMiniController.h"
#import <GoogleCast/GoogleCast.h>

@implementation RNGoogleCastMiniController {
    GCKUIMiniMediaControlsViewController *_miniController;
}

- (instancetype)init {
    if (self = [super init]) {
        _miniController = [[GCKUIMiniMediaControlsViewController alloc] init];
        [_miniController.view setFrame:self.bounds];
        _miniController.view.autoresizingMask = UIViewAutoresizingFlexibleWidth | UIViewAutoresizingFlexibleHeight;
        [self addSubview:_miniController.view];
    }
    return self;
}

- (void)layoutSubviews {
    [super layoutSubviews];
    _miniController.view.frame = self.bounds;
}

@end
