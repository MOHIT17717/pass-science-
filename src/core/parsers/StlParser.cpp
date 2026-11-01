#include "StlParser.h"
#include <sstream>
#include <fstream>
#include <algorithm>
#include <stdexcept>
#include <cctype>
#include <cstring>

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

Vector3D compute_normal(const Vector3D& v1, const Vector3D& v2, const Vector3D& v3) {
    Vector3D e1{ v2.x - v1.x, v2.y - v1.y, v2.z - v1.z };
    Vector3D e2{ v3.x - v1.x, v3.y - v1.y, v3.z - v1.z };
    Vector3D cross{
        e1.y * e2.z - e1.z * e2.y,
        e1.z * e2.x - e1.x * e2.z,
        e1.x * e2.y - e1.y * e2.x
    };
    double len = cross.length();
    if (len > 1e-14) {
        cross.x /= len;
        cross.y /= len;
        cross.z /= len;
    } else {
        cross = { 0.0, 0.0, 1.0 }; // Fallback normal for degenerate flat triangles
    }
    return cross;
}

} // namespace

StlModel StlParser::parse_ascii(std::string_view content) {
    // Strip UTF-8 BOM if present (0xEF, 0xBB, 0xBF)
    if (content.size() >= 3 &&
        static_cast<unsigned char>(content[0]) == 0xEF &&
        static_cast<unsigned char>(content[1]) == 0xBB &&
        static_cast<unsigned char>(content[2]) == 0xBF) {
        content.remove_prefix(3);
    }

    if (content.empty()) {
        throw std::invalid_argument("STL content is empty (0 bytes).");
    }

    if (content.size() > MAX_FILE_SIZE_BYTES) {
        throw std::invalid_argument("STL content size (" + std::to_string(content.size()) +
                                   " bytes) exceeds maximum file size limit of 10 MB.");
    }

    if (trim(content).empty()) {
        throw std::invalid_argument("STL content is empty (0 bytes).");
    }

    // Structural Binary STL detection:
    // Binary STL has an 80-byte header, 4-byte uint32 triangle count N, followed by exactly 50*N bytes.
    // Total binary file size is always exactly (84 + 50 * N) bytes.
    if (content.size() >= 84) {
        uint32_t num_triangles = 0;
        std::memcpy(&num_triangles, content.data() + 80, sizeof(uint32_t));
        uint64_t expected_binary_size = 84ULL + static_cast<uint64_t>(num_triangles) * 50ULL;
        if (expected_binary_size == content.size()) {
            throw std::invalid_argument("Binary STL detected (structural binary size match: 84 + 50*N bytes). Only ASCII STL files are supported.");
        }
    }

    // Binary STL detection: check for null bytes and non-printable control characters
    size_t check_len = (std::min)(content.size(), static_cast<size_t>(1024));
    for (size_t i = 0; i < check_len; ++i) {
        unsigned char c = static_cast<unsigned char>(content[i]);
        if (c == 0 || (c < 0x09) || (c > 0x0D && c < 0x20) || c > 0x7E) {
            throw std::invalid_argument("Binary STL detected. Only ASCII STL files are supported.");
        }
    }

    StlModel model;
    std::string content_str(content);
    std::istringstream stream(content_str);
    std::string line;
    size_t line_number = 0;
    bool found_solid = false;
    bool found_endsolid = false;

    // First line must start with "solid"
    while (std::getline(stream, line)) {
        ++line_number;
        std::string trimmed = trim(line);
        if (trimmed.empty()) continue;

        std::string lower = to_lower(trimmed);
        if (lower.rfind("solid", 0) != 0) {
            throw std::invalid_argument("Malformed STL on line " + std::to_string(line_number) +
                                       ": Expected 'solid [name]', but found '" + trimmed + "'. Binary STL is not supported.");
        }

        found_solid = true;
        if (trimmed.size() > 5) {
            model.solid_name = trim(trimmed.substr(5));
        }
        break;
    }

    if (!found_solid) {
        throw std::invalid_argument("STL file is empty or does not contain a valid 'solid' header.");
    }

    // Parse facets
    while (std::getline(stream, line)) {
        ++line_number;
        std::string trimmed = trim(line);
        if (trimmed.empty()) continue;

        std::string lower = to_lower(trimmed);

        if (lower.rfind("endsolid", 0) == 0) {
            found_endsolid = true;
            break;
        }

        if (lower.rfind("facet", 0) != 0) {
            throw std::invalid_argument("Malformed STL on line " + std::to_string(line_number) +
                                       ": Expected 'facet normal' or 'endsolid', found: " + trimmed);
        }

        // Parse facet normal
        std::istringstream facet_stream(trimmed);
        std::string kw_facet, kw_normal;
        Vector3D normal;
        if (!(facet_stream >> kw_facet >> kw_normal >> normal.x >> normal.y >> normal.z) ||
            to_lower(kw_facet) != "facet" || to_lower(kw_normal) != "normal" || !normal.is_finite()) {
            throw std::invalid_argument("Malformed STL facet normal on line " + std::to_string(line_number) +
                                       ": Expected 'facet normal <nx> <ny> <nz>' with finite numbers.");
        }

        // Next line must be "outer loop"
        std::string loop_line;
        bool got_loop = false;
        while (std::getline(stream, loop_line)) {
            ++line_number;
            std::string t = trim(loop_line);
            if (t.empty()) continue;
            if (to_lower(t) != "outer loop") {
                throw std::invalid_argument("Malformed STL on line " + std::to_string(line_number) +
                                           ": Expected 'outer loop', found: " + t);
            }
            got_loop = true;
            break;
        }
        if (!got_loop) {
            throw std::invalid_argument("Unexpected end of STL file while expecting 'outer loop' on line " +
                                       std::to_string(line_number));
        }

        // Exactly 3 vertex lines
        Vector3D vertices[3];
        for (int v = 0; v < 3; ++v) {
            std::string vert_line;
            bool got_vertex = false;
            while (std::getline(stream, vert_line)) {
                ++line_number;
                std::string vt = trim(vert_line);
                if (vt.empty()) continue;

                std::istringstream vert_stream(vt);
                std::string kw_vertex;
                if (!(vert_stream >> kw_vertex >> vertices[v].x >> vertices[v].y >> vertices[v].z) ||
                    to_lower(kw_vertex) != "vertex" || !vertices[v].is_finite()) {
                    throw std::invalid_argument("Malformed STL vertex on line " + std::to_string(line_number) +
                                               ": Expected 'vertex <x> <y> <z>' with finite numbers.");
                }
                got_vertex = true;
                model.bbox.expand(vertices[v]);
                break;
            }
            if (!got_vertex) {
                throw std::invalid_argument("Unexpected end of STL file while reading vertices for facet on line " +
                                           std::to_string(line_number));
            }
        }

        // Next line must be "endloop"
        std::string endloop_line;
        bool got_endloop = false;
        while (std::getline(stream, endloop_line)) {
            ++line_number;
            std::string t = trim(endloop_line);
            if (t.empty()) continue;
            if (to_lower(t) != "endloop") {
                throw std::invalid_argument("Malformed STL on line " + std::to_string(line_number) +
                                           ": Expected 'endloop', found: " + t);
            }
            got_endloop = true;
            break;
        }
        if (!got_endloop) {
            throw std::invalid_argument("Unexpected end of STL file while expecting 'endloop' on line " +
                                       std::to_string(line_number));
        }

        // Next line must be "endfacet"
        std::string endfacet_line;
        bool got_endfacet = false;
        while (std::getline(stream, endfacet_line)) {
            ++line_number;
            std::string t = trim(endfacet_line);
            if (t.empty()) continue;
            if (to_lower(t) != "endfacet") {
                throw std::invalid_argument("Malformed STL on line " + std::to_string(line_number) +
                                           ": Expected 'endfacet', found: " + t);
            }
            got_endfacet = true;
            break;
        }
        if (!got_endfacet) {
            throw std::invalid_argument("Unexpected end of STL file while expecting 'endfacet' on line " +
                                       std::to_string(line_number));
        }

        Triangle3D tri;
        tri.v1 = vertices[0];
        tri.v2 = vertices[1];
        tri.v3 = vertices[2];

        // Check normal: preserve supplied if non-zero, otherwise compute geometric normal
        if (normal.length() < 1e-12) {
            tri.normal = compute_normal(tri.v1, tri.v2, tri.v3);
            tri.normal_recomputed = true;
        } else {
            double len = normal.length();
            tri.normal = { normal.x / len, normal.y / len, normal.z / len };
            tri.normal_recomputed = false;
        }

        model.triangles.push_back(tri);

        if (model.triangles.size() > MAX_STL_TRIANGLES) {
            throw std::invalid_argument("STL triangle count exceeds maximum allowed limit of " +
                                       std::to_string(MAX_STL_TRIANGLES) + " triangles.");
        }
    }

    if (!found_endsolid) {
        throw std::invalid_argument("Malformed STL: Unexpected end-of-file; missing 'endsolid' statement.");
    }

    if (model.triangles.empty()) {
        throw std::invalid_argument("STL file contains 0 triangles. Geometry must contain at least one valid triangle.");
    }

    model.triangle_count = model.triangles.size();
    model.is_valid = true;
    return model;
}

StlModel StlParser::parse_file(const std::string& filepath) {
    std::ifstream file(filepath, std::ios::binary);
    if (!file.is_open()) {
        throw std::runtime_error("Could not open STL file: " + filepath);
    }
    file.seekg(0, std::ios::end);
    std::streampos length = file.tellg();
    file.seekg(0, std::ios::beg);

    if (length <= 0) {
        throw std::invalid_argument("STL file is empty (0 bytes): " + filepath);
    }
    if (static_cast<size_t>(length) > MAX_FILE_SIZE_BYTES) {
        throw std::invalid_argument("STL file exceeds maximum file size limit of 10 MB: " + filepath);
    }

    std::string buffer;
    buffer.resize(static_cast<size_t>(length));
    file.read(&buffer[0], length);
    return parse_ascii(buffer);
}

} // namespace uew::parsers
