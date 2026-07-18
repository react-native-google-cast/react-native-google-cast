package com.margelo.nitro.googlecast

import org.json.JSONObject
import java.io.File

/**
 * Loads the shared heuristic-vector corpus (`fixtures/cast-options/heuristics.json`
 * at the repo root) for the cast-options defaults suite (E3). The same file is
 * read by the iOS `NitroImagePickerTests`, so the expected values are the single
 * cross-platform source of truth — Kotlin/Swift drift is a red test.
 */
internal object CastOptionsCorpus {
  fun load(): JSONObject {
    val file = resolve("fixtures/cast-options/heuristics.json")
    return JSONObject(file.readText())
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
