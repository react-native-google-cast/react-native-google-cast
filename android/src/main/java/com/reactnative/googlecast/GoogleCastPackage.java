package com.reactnative.googlecast;

import android.content.pm.PackageManager;
import com.facebook.react.ReactPackage;
import com.facebook.react.bridge.JavaScriptModule;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewManager;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

public class GoogleCastPackage implements ReactPackage {
  static final String NAMESPACE = "com.chromecastreactnative.NAMESPACE";

  static String metadata(String key, String defaultValue, ReactApplicationContext reactContext) {
    try {
      return reactContext.getPackageManager()
              .getApplicationInfo(reactContext.getPackageName(), PackageManager.GET_META_DATA)
              .metaData.getString(key, defaultValue);
    } catch (PackageManager.NameNotFoundException e) {
      throw new RuntimeException(e);
    }
  }

  @Override
  public List<NativeModule>
  createNativeModules(ReactApplicationContext reactContext) {
    List<NativeModule> modules = new ArrayList<>();

    modules.add(new GoogleCastModule(reactContext));

    return modules;
  }

  public List<Class<? extends JavaScriptModule>> createJSModules() {
    return Collections.emptyList();
  }

  @Override
  public List<ViewManager>
  createViewManagers(ReactApplicationContext reactContext) {
    List<ViewManager> managers = new ArrayList<>();

    managers.add(new GoogleCastButtonManager());

    return managers;
  }
}