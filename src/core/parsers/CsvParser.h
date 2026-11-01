#pragma once

#include "ParserModels.h"
#include <string>
#include <string_view>

namespace uew::parsers {

/**
 * Strict C++17 CSV parser for 3D ANSYS/thermal temperature node exports.
 *
 * Capabilities & Guarantees:
 * - Enforces exact schema: node_id,x_m,y_m,z_m,temperature_C
 * - RFC 4180-compliant quoting (supports quoted and unquoted fields, escaped quotes, whitespace trimming).
 * - Detects explicit metadata comments (#) and extracts provenance/synthetic status accurately.
 * - Rejects duplicate node IDs in O(1) time complexity.
 * - Rejects non-finite values (NaN/Inf) and unphysical temperatures (< -273.15 C).
 * - Enforces 10 MB file-size limit and 100,000 record cap.
 * - Computes dataset temperature statistics (min, max, average) and 3D spatial bounding box.
 */
class CsvParser {
public:
    static TemperatureDataset parse_csv(std::string_view content);
    static TemperatureDataset parse_file(const std::string& filepath);
};

} // namespace uew::parsers
