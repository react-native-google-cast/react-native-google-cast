package com.reactnative.googlecast.castvideos;

import android.content.Context;

import androidx.multidex.MultiDex;

import com.brentvatne.react.ReactVideoPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.facebook.react.shell.MainReactPackage;
import com.reactnative.googlecast.GoogleCastPackage;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.reactnativenavigation.react.ReactGateway;
import com.swmansion.gesturehandler.react.RNGestureHandlerPackage;
import com.swmansion.reanimated.ReanimatedPackage;

import java.util.ArrayList;
import java.util.List;

public class MainApplication extends NavigationApplication {

  @Override
  protected void attachBaseContext(Context base) {
    super.attachBaseContext(base);
    MultiDex.install(this);
  }

  @Override
  protected ReactGateway createReactGateway() {
    ReactNativeHost host = new NavigationReactNativeHost(
        this, isDebug(), createAdditionalReactPackages()) {
      @Override
      protected String getJSMainModuleName() {
        return "example/index";
      }
    };
    return new ReactGateway(this, isDebug(), host);
  }

  @Override
  public boolean isDebug() {
    return BuildConfig.DEBUG;
  }

  protected List<ReactPackage> getPackages() {
    // We're not using auto-linking in the example project
    // because it shares dependencies with playground
    // so we only hand-pick the ones we actually need here.

    // @SuppressWarnings("UnnecessaryLocalVariable")
    // List<ReactPackage> packages = new PackageList(this).getPackages();

    // Packages that cannot be autolinked yet can be added manually here, for
    // example: packages.add(new MyReactNativePackage());

    List<ReactPackage> packages = new ArrayList<>();

    packages.add(new MainReactPackage());

    packages.add(new GoogleCastPackage());

    // This is only here because the example project uses these dependencies.
    // You probably don't need this ;-)
    packages.add(new RNGestureHandlerPackage());
    packages.add(new ReanimatedPackage());
    packages.add(new ReactVideoPackage());

    return packages;
  }

  @Override
  public List<ReactPackage> createAdditionalReactPackages() {
    return getPackages();
  }
}
