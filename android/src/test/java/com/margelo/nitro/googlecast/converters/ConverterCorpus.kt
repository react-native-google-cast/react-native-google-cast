package com.margelo.nitro.googlecast.converters

import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/**
 * Loads the shared golden-fixture corpus (the JSON files under `fixtures/converters` at
 * the repo root) for the converter parity suite. The same files are read by the iOS XCTest
 * suite, so the expected values are the single cross-platform source of truth.
 */
internal object ConverterCorpus {
  fun load(name: String): JSONArray {
    val file = resolve("fixtures/converters/$name.json")
    val json = JSONObject(file.readText())
    return json.getJSONArray("fixtures")
  }

  /** Resolve a repo-relative path whether tests run from the module dir or the repo root. */
  private fun resolve(relative: String): File {
    val candidates = listOf(
      File(relative),
      File("..", relative),
      File("../..", relative)
    )
    return candidates.firstOrNull { it.exists() }
      ?: error("Fixture not found: $relative (cwd=${File(".").absolutePath})")
  }
}
