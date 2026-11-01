#pragma once

#include "ParserModels.h"
#include <string>
#include <string_view>

namespace uew::parsers {

/**
 * Robust C++17 ASCII STL parser.
 *
 * Capabilities & Guarantees:
 * - Strictly parses and validates ASCII STL grammar.
 * - Detects and rejects binary STL files via structural header/size inspection (84 + 50*N bytes)
 *   and control-character byte scanning, even if the 80-byte header contains printable ASCII starting with 'solid'.
 * - Rejects files exceeding 10 MB or 50,000 triangles.
 * - Rejects 0-triangle empty geometry and truncated files with unexpected EOF.
 * - Supports UTF-8 BOM stripping and transparent CRLF/LF line ending handling.
 * - Rejects non-finite coordinates (NaN/Inf).
 * - Normal Vector Policy:
 *   * Preserves non-degenerate supplied facet normals (normalized to unit length) as authored
 *     by upstream CAD software, respecting custom authoring intent (`normal_recomputed = false`).
 *   * Recomputes degenerate facet normals (length < 1e-12, e.g. 0 0 0) using right-hand rule
 *     cross product (v2 - v1) x (v3 - v1), setting `normal_recomputed = true`.
 * - Computes complete 3D spatial bounding box initialized using std::numeric_limits<double>::max().
 */
class StlParser {
public:
    static StlModel parse_ascii(std::string_view content);
    static StlModel parse_file(const std::string& filepath);
};

} // namespace uew::parsers
