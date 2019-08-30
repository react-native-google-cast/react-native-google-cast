package com.reactnative.googlecast.playground;

import android.app.Application;

import com.facebook.react.ReactApplication;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.facebook.soloader.SoLoader;
import com.reactnative.googlecast.GoogleCastPackage;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;

import java.util.ArrayList;
import java.util.List;

public class MainApplication extends Application implements ReactApplication {

  private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
    @Override
    public boolean getUseDeveloperSupport() {
      return BuildConfig.DEBUG;
    }

    @Override
    protected List<ReactPackage> getPackages() {
      // We're not using auto-linking in the playground project
      // because it shares dependencies with example
      // so we only hand-pick the ones we actually need here.

      // @SuppressWarnings("UnnecessaryLocalVariable")
      // List<ReactPackage> packages = new PackageList(this).getPackages();

      // Packages that cannot be autolinked yet can be added manually here, for
      // example: packages.add(new MyReactNativePackage());

      List<ReactPackage> packages = new ArrayList<>();

      packages.add(new MainReactPackage());
      packages.add(new GoogleCastPackage());
      packages.add(new RNGestureHandlerPackage());

      return packages;
    }

    @Override
    protected String getJSMainModuleName() {
      return "playground/index";
    }
  };

  @Override
  public ReactNativeHost getReactNativeHost() {
    return mReactNativeHost;
  }

  @Override
  public void onCreate() {
    super.onCreate();
    SoLoader.init(this, /* native exopackage */ false);
  }
}
