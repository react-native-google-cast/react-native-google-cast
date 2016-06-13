//
//  CalendarManager.m
//  ReactNativeGoogleCast
//
//  Created by Carlos Eduardo López Mercado on 5/28/16.
//  Copyright © 2016 Facebook. All rights reserved.
//

#import "CalendarManager.h"
#import "RCTLog.h"

@implementation CalendarManager

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(addEvent:(NSString *)name location:(NSString *)location)
{
  RCTLogInfo(@"Pretending to create an event %@ at %@", name, location);
}

@end