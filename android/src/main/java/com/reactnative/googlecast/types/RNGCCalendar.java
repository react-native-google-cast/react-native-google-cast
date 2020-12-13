package com.reactnative.googlecast.types;

import androidx.annotation.Nullable;

import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;

public class RNGCCalendar {
  public static @Nullable Calendar fromJson(final @Nullable String json) {
    if (json == null) return null;

    try {
      Calendar calendar = Calendar.getInstance();
      Date date = formatter.parse(json);
      if (date == null) return null;
      calendar.setTime(date);
      return calendar;
    } catch (ParseException e) {
      return null;
    }
  }

  public static @Nullable String toJson(@Nullable Calendar calendar) {
    if (calendar == null) return null;

    return formatter.format(calendar.getTime());
  }

  private static final SimpleDateFormat formatter = new SimpleDateFormat("yyyy-MM-dd");
}
