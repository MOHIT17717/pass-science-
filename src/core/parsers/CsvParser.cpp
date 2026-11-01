#include "CsvParser.h"
#include <sstream>
#include <fstream>
#include <algorithm>
#include <stdexcept>
#include <unordered_set>
#include <cctype>

namespace uew::parsers {

namespace {

std::string trim(std::string_view sv) {
    size_t first = 0;
    while (first < sv.size() && (std::isspace(static_cast<unsigned char>(sv[first])))) {
        ++first;
    }
    if (first == sv.size()) return "";
    size_t last = sv.size() - 1;
    while (last > first && (std::isspace(static_cast<unsigned char>(sv[last])))) {
        --last;
    }
    return std::string(sv.substr(first, last - first + 1));
}

std::string to_lower(std::string_view sv) {
    std::string res;
    res.reserve(sv.size());
    for (char c : sv) {
        res.push_back(static_cast<char>(std::tolower(static_cast<unsigned char>(c))));
    }
    return res;
}

std::vector<std::string> parse_csv_row(std::string_view line, size_t line_number) {
    std::vector<std::string> fields;
    std::string current;
    bool in_quotes = false;

    for (size_t i = 0; i < line.size(); ++i) {
        char c = line[i];
        if (c == '"') {
            if (in_quotes && i + 1 < line.size() && line[i + 1] == '"') {
                current.push_back('"');
                ++i;
            } else {
                in_quotes = !in_quotes;
            }
        } else if (c == ',' && !in_quotes) {
            fields.push_back(trim(current));
            current.clear();
        } else {
            current.push_back(c);
        }
    }

    if (in_quotes) {
        throw std::invalid_argument("Malformed CSV on line " + std::to_string(line_number) +
                                   ": Unclosed double quote.");
    }

    fields.push_back(trim(current));
    return fields;
}

} // namespace

TemperatureDataset CsvParser::parse_csv(std::string_view content) {
    // Strip UTF-8 BOM if present (0xEF, 0xBB, 0xBF)
    if (content.size() >= 3 &&
        static_cast<unsigned char>(content[0]) == 0xEF &&
        static_cast<unsigned char>(content[1]) == 0xBB &&
        static_cast<unsigned char>(content[2]) == 0xBF) {
        content.remove_prefix(3);
    }

    if (content.empty()) {
        throw std::invalid_argument("CSV content is empty (0 bytes).");
    }

    if (content.size() > MAX_FILE_SIZE_BYTES) {
        throw std::invalid_argument("CSV content size (" + std::to_string(content.size()) +
                                   " bytes) exceeds maximum file size limit of 10 MB.");
    }

    if (trim(content).empty()) {
        throw std::invalid_argument("CSV content is empty (0 bytes).");
    }

    TemperatureDataset dataset;
    std::string content_str(content);
    std::istringstream stream(content_str);
    std::string line;
    size_t line_number = 0;

    bool found_header = false;
    std::string extracted_provenance;
    bool explicit_synthetic_detected = false;

    std::unordered_set<int64_t> seen_node_ids;
    double sum_temp = 0.0;
    double min_temp = std::numeric_limits<double>::max();
    double max_temp = std::numeric_limits<double>::lowest();

    while (std::getline(stream, line)) {
        ++line_number;
        if (!line.empty() && line.back() == '\r') line.pop_back();
        std::string trimmed = trim(line);
        if (trimmed.empty()) continue;

        // Process comment/metadata lines starting with '#'
        if (trimmed[0] == '#') {
            std::string comment = trim(trimmed.substr(1));
            std::string lower_comment = to_lower(comment);
            if (lower_comment.find("provenance:") != std::string::npos ||
                lower_comment.find("synthetic") != std::string::npos ||
                lower_comment.find("ansys") != std::string::npos) {
                if (!extracted_provenance.empty()) extracted_provenance += "; ";
                extracted_provenance += comment;
            }
            if (lower_comment.find("synthetic") != std::string::npos ||
                lower_comment.find("analytical") != std::string::npos) {
                explicit_synthetic_detected = true;
            }
            continue;
        }

        // Header check
        if (!found_header) {
            std::vector<std::string> header_fields = parse_csv_row(trimmed, line_number);
            if (header_fields.size() != 5 ||
                to_lower(header_fields[0]) != "node_id" ||
                to_lower(header_fields[1]) != "x_m" ||
                to_lower(header_fields[2]) != "y_m" ||
                to_lower(header_fields[3]) != "z_m" ||
                to_lower(header_fields[4]) != "temperature_c") {
                std::string found_hdr;
                for (size_t i = 0; i < header_fields.size(); ++i) {
                    if (i > 0) found_hdr += ",";
                    found_hdr += header_fields[i];
                }
                throw std::invalid_argument("Invalid CSV header on line " + std::to_string(line_number) +
                                           ": Expected 'node_id,x_m,y_m,z_m,temperature_C', found: '" + found_hdr + "'");
            }
            found_header = true;
            continue;
        }

        // Data row parsing
        std::vector<std::string> fields = parse_csv_row(trimmed, line_number);
        if (fields.size() != 5) {
            throw std::invalid_argument("Malformed CSV on line " + std::to_string(line_number) +
                                       ": Expected exactly 5 columns, found " + std::to_string(fields.size()) +
                                       " columns: " + trimmed);
        }

        // Parse node_id
        int64_t node_id = 0;
        try {
            size_t idx = 0;
            node_id = std::stoll(fields[0], &idx);
            if (idx != fields[0].size() || node_id < 0) {
                throw std::invalid_argument("Invalid node_id");
            }
        } catch (...) {
            throw std::invalid_argument("Invalid node_id on line " + std::to_string(line_number) +
                                       ": Expected non-negative integer, found '" + fields[0] + "'");
        }

        if (seen_node_ids.find(node_id) != seen_node_ids.end()) {
            throw std::invalid_argument("Duplicate node_id " + std::to_string(node_id) +
                                       " detected on line " + std::to_string(line_number) + ".");
        }
        seen_node_ids.insert(node_id);

        // Parse coordinates and temperature
        double x = 0.0, y = 0.0, z = 0.0, temp = 0.0;
        try {
            size_t idx = 0;
            x = std::stod(fields[1], &idx);
            if (idx != fields[1].size() || !std::isfinite(x)) throw std::invalid_argument("x");

            y = std::stod(fields[2], &idx);
            if (idx != fields[2].size() || !std::isfinite(y)) throw std::invalid_argument("y");

            z = std::stod(fields[3], &idx);
            if (idx != fields[3].size() || !std::isfinite(z)) throw std::invalid_argument("z");

            temp = std::stod(fields[4], &idx);
            if (idx != fields[4].size() || !std::isfinite(temp)) throw std::invalid_argument("temp");
        } catch (...) {
            throw std::invalid_argument("Non-finite or invalid numeric value on line " + std::to_string(line_number) +
                                       ": '" + trimmed + "'");
        }

        // Physical validity check: temperature cannot be below absolute zero (-273.15 C)
        if (temp < -273.15) {
            throw std::invalid_argument("Unphysical temperature on line " + std::to_string(line_number) +
                                       ": Temperature " + fields[4] + " C is below absolute zero (-273.15 C).");
        }

        TemperatureNode node;
        node.node_id = node_id;
        node.x_m = x;
        node.y_m = y;
        node.z_m = z;
        node.temperature_C = temp;

        dataset.nodes.push_back(node);
        dataset.bbox.expand({ x, y, z });

        sum_temp += temp;
        if (temp < min_temp) min_temp = temp;
        if (temp > max_temp) max_temp = temp;

        if (dataset.nodes.size() > MAX_CSV_RECORDS) {
            throw std::invalid_argument("CSV record count exceeds maximum allowed limit of " +
                                       std::to_string(MAX_CSV_RECORDS) + " rows.");
        }
    }

    if (!found_header) {
        throw std::invalid_argument("CSV file does not contain a valid header 'node_id,x_m,y_m,z_m,temperature_C'.");
    }

    if (dataset.nodes.empty()) {
        throw std::invalid_argument("CSV file contains a header but zero data rows.");
    }

    dataset.node_count = dataset.nodes.size();
    dataset.min_temperature_C = min_temp;
    dataset.max_temperature_C = max_temp;
    dataset.avg_temperature_C = sum_temp / static_cast<double>(dataset.node_count);
    dataset.is_synthetic = explicit_synthetic_detected;
    dataset.provenance = extracted_provenance.empty() ? "unspecified" : extracted_provenance;
    dataset.is_valid = true;

    return dataset;
}

TemperatureDataset CsvParser::parse_file(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open CSV file: " + filepath);
    }
    file.seekg(0, std::ios::end);
    std::streampos length = file.tellg();
    file.seekg(0, std::ios::beg);

    if (length <= 0) {
        throw std::invalid_argument("CSV file is empty (0 bytes): " + filepath);
    }
    if (static_cast<size_t>(length) > MAX_FILE_SIZE_BYTES) {
        throw std::invalid_argument("CSV file exceeds maximum file size limit of 10 MB: " + filepath);
    }

    std::string buffer;
    buffer.resize(static_cast<size_t>(length));
    file.read(&buffer[0], length);
    return parse_csv(buffer);
}

} // namespace uew::parsers
