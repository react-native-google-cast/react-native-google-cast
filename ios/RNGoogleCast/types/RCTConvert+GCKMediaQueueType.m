#import <GoogleCast/GoogleCast.h>
#import <React/RCTConvert.h>

@implementation RCTConvert (GCKMediaQueueType)

RCT_ENUM_CONVERTER(GCKMediaQueueType, (@{
                     @"album" : @(GCKMediaQueueTypeAlbum),
                     @"audioBook" : @(GCKMediaQueueTypeAudioBook),
                     @"liveTv" : @(GCKMediaQueueTypeLiveTV),
                     @"movie" : @(GCKMediaQueueTypeMovie),
                     @"playlist" : @(GCKMediaQueueTypePlaylist),
                     @"radioStation" : @(GCKMediaQueueTypeRadioStation),
                     @"podcastSeries" : @(GCKMediaQueueTypePodcastSeries),
                     @"tvSeries" : @(GCKMediaQueueTypeTVSeries),
                     @"videoPlaylist" : @(GCKMediaQueueTypeVideoPlayList),
                   }),
                   GCKMediaQueueTypeGeneric, integerValue)

+ (id)fromGCKMediaQueueType:(GCKMediaQueueType)type {
  switch (type) {
  case GCKMediaQueueTypeAlbum:
    return @"album";
  case GCKMediaQueueTypeAudioBook:
    return @"audioBook";
  case GCKMediaQueueTypeLiveTV:
    return @"liveTv";
  case GCKMediaQueueTypeMovie:
    return @"movie";
  case GCKMediaQueueTypePlaylist:
    return @"playlist";
  case GCKMediaQueueTypeRadioStation:
    return @"radioStation";
  case GCKMediaQueueTypePodcastSeries:
    return @"podcastSeries";
  case GCKMediaQueueTypeTVSeries:
    return @"tvSeries";
  case GCKMediaQueueTypeVideoPlayList:
    return @"videoPlaylist";
  default:
    return [NSNull null];
  }
}

@end
