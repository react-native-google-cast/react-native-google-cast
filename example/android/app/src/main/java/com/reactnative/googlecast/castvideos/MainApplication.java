package com.reactnative.googlecast.castvideos;

import android.content.Context;

import androidx.multidex.MultiDex;

import com.facebook.react.PackageList;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.reactnative.googlecast.GoogleCastPackage;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;

import java.util.List;

public class MainApplication extends NavigationApplication {
  private final ReactNativeHost mReactNativeHost =
    new NavigationReactNativeHost(this) {
      @Override
      public boolean getUseDeveloperSupport() {
        return BuildConfig.DEBUG;
      }

      @Override
      protected List<ReactPackage> getPackages() {
        @SuppressWarnings("UnnecessaryLocalVariable")
        List<ReactPackage> packages = new PackageList(this).getPackages();
        // Packages that cannot be autolinked yet can be added manually here, for example:
        // packages.add(new MyReactNativePackage());
        packages.add(new GoogleCastPackage());

        return packages;
      }

      @Override
      protected String getJSMainModuleName() {
        return "index";
      }
    };

  @Override
  protected void attachBaseContext(Context base) {
    super.attachBaseContext(base);
    MultiDex.install(this);
  }

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
//    initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
  }
}
