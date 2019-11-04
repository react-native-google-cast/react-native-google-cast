#import <GoogleCast/GoogleCast.h>
#import <React/RCTEventEmitter.h>

static NSString *const SESSION_STARTING = @"GoogleCast:SessionStarting";
static NSString *const SESSION_STARTED = @"GoogleCast:SessionStarted";
static NSString *const SESSION_START_FAILED = @"GoogleCast:SessionStartFailed";
static NSString *const SESSION_SUSPENDED = @"GoogleCast:SessionSuspended";
static NSString *const SESSION_RESUMING = @"GoogleCast:SessionResuming";
static NSString *const SESSION_RESUMED = @"GoogleCast:SessionResumed";
static NSString *const SESSION_ENDING = @"GoogleCast:SessionEnding";
static NSString *const SESSION_ENDED = @"GoogleCast:SessionEnded";

@interface RNGCSessionManager : RCTEventEmitter <GCKSessionManagerListener>
  
@end
