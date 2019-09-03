#import <GoogleCast/GoogleCast.h>

static NSString *const SESSION_STARTING = @"GoogleCast:SessionStarting";
static NSString *const SESSION_STARTED = @"GoogleCast:SessionStarted";
static NSString *const SESSION_START_FAILED = @"GoogleCast:SessionStartFailed";
static NSString *const SESSION_SUSPENDED = @"GoogleCast:SessionSuspended";
static NSString *const SESSION_RESUMING = @"GoogleCast:SessionResuming";
static NSString *const SESSION_RESUMED = @"GoogleCast:SessionResumed";
static NSString *const SESSION_ENDING = @"GoogleCast:SessionEnding";
static NSString *const SESSION_ENDED = @"GoogleCast:SessionEnded";

@interface RNGCSessionManager <GCKSessionManagerListener>

+ constantsToExport = @{
  @"SESSION_STARTING" : SESSION_STARTING,
  @"SESSION_STARTED" : SESSION_STARTED,
  @"SESSION_START_FAILED" : SESSION_START_FAILED,
  @"SESSION_SUSPENDED" : SESSION_SUSPENDED,
  @"SESSION_RESUMING" : SESSION_RESUMING,
  @"SESSION_RESUMED" : SESSION_RESUMED,
  @"SESSION_ENDING" : SESSION_ENDING,
  @"SESSION_ENDED" : SESSION_ENDED,
};

+ supportedEvents = @[
  SESSION_STARTING,
  SESSION_STARTED,
  SESSION_START_FAILED,
  SESSION_SUSPENDED,
  SESSION_RESUMING,
  SESSION_RESUMED,
  SESSION_ENDING,
  SESSION_ENDED,
];

@end
