package com.reactnative.googlecast.castvideos;

import com.brentvatne.react.ReactVideoPackage;
import com.facebook.react.ReactNativeHost;
import com.facebook.react.ReactPackage;
import com.reactnative.googlecast.GoogleCastPackage;
import com.reactnativenavigation.NavigationApplication;
import com.reactnativenavigation.react.NavigationReactNativeHost;
import com.reactnativenavigation.react.ReactGateway;

import java.util.Arrays;
import java.util.List;

public class MainApplication extends NavigationApplication {

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
    // Add additional packages you require here
    // No need to add RnnPackage and MainReactPackage
    return Arrays.<ReactPackage>asList(
      new GoogleCastPackage(),
      new ReactVideoPackage()
    );
  }

  @Override
  public List<ReactPackage> createAdditionalReactPackages() {
    return getPackages();
  }
}
