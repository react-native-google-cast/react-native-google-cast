package com.margelo.nitro.googlecast.converters

import androidx.test.platform.app.InstrumentationRegistry
import org.json.JSONArray
import org.json.JSONObject

/**
 * Loads the shared golden-fixture corpus for the instrumented converter parity suite.
 *
 * Fixture files are bundled as androidTest assets from the repo-root `fixtures/` directory
 * (configured via `sourceSets.androidTest.assets.srcDirs` in build.gradle). The path inside
 * the APK is `converters/<name>.json`.
 *
 * The same JSON files are consumed by the iOS XCTest suite (via the test bundle) and the
 * Robolectric suite (via the file system), so the expected values are the single
 * cross-platform source of truth.
 */
internal object InstrumentedCorpus {
  fun load(name: String): JSONArray {
    val context = InstrumentationRegistry.getInstrumentation().context
    val text = context.assets.open("converters/$name.json").bufferedReader().readText()
    return JSONObject(text).getJSONArray("fixtures")
  }
}
