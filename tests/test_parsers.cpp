#include "core/parsers/StlParser.h"
#include "core/parsers/CsvParser.h"
#include <iostream>
#include <cmath>
#include <cassert>
#include <stdexcept>
#include <string>
#include <fstream>
#include <sstream>
#include <vector>
#include <cstring>

using namespace uew::parsers;

static std::string resolve_data_path(const std::string& rel_path) {
    std::ifstream f1(rel_path);
    if (f1.is_open()) return rel_path;
    std::string p2 = "../" + rel_path;
    std::ifstream f2(p2);
    if (f2.is_open()) return p2;
    return rel_path;
}

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "\n[TEST FAILURE] " << (msg) << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            throw std::runtime_error(std::string("Assertion failed: ") + (msg)); \
        } \
    } while (0)

static int g_tests_run = 0;
static int g_tests_passed = 0;

void run_test(const char* name, void (*fn)()) {
    ++g_tests_run;
    std::cout << "[RUNNING] " << name << "... " << std::flush;
    try {
        fn();
        ++g_tests_passed;
        std::cout << "PASSED\n";
    } catch (const std::exception& e) {
        std::cout << "FAILED (" << e.what() << ")\n";
    } catch (...) {
        std::cout << "FAILED (unknown exception)\n";
    }
}

// ---------------- STL Parser Tests ----------------

void test_stl_valid_in_memory() {
    const std::string valid_stl =
        "solid test_triangle\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n"
        "  endfacet\n"
        "endsolid test_triangle\n";

    StlModel model = StlParser::parse_ascii(valid_stl);
    TEST_ASSERT(model.is_valid, "Model should be valid");
    TEST_ASSERT(model.solid_name == "test_triangle", "Solid name mismatch");
    TEST_ASSERT(model.triangle_count == 1, "Should have 1 triangle");
    TEST_ASSERT(model.triangles.size() == 1, "Triangles vector size mismatch");
    TEST_ASSERT(!model.triangles[0].normal_recomputed, "Valid normal should not be recomputed");
    TEST_ASSERT(std::abs(model.triangles[0].normal.z - 1.0) < 1e-6, "Normal Z should be 1.0");

    TEST_ASSERT(model.bbox.is_valid(), "Bounding box should be valid");
    TEST_ASSERT(std::abs(model.bbox.min.x - 0.0) < 1e-6, "BBox min X mismatch");
    TEST_ASSERT(std::abs(model.bbox.max.x - 1.0) < 1e-6, "BBox max X mismatch");
    TEST_ASSERT(std::abs(model.bbox.max.y - 1.0) < 1e-6, "BBox max Y mismatch");
}

void test_stl_degenerate_normal_recomputation() {
    const std::string zero_normal_stl =
        "solid zero_normal\n"
        "  facet normal 0.0 0.0 0.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n"
        "  endfacet\n"
        "endsolid zero_normal\n";

    StlModel model = StlParser::parse_ascii(zero_normal_stl);
    TEST_ASSERT(model.is_valid, "Model should be valid");
    TEST_ASSERT(model.triangle_count == 1, "Should have 1 triangle");
    TEST_ASSERT(model.triangles[0].normal_recomputed, "Degenerate normal must be recomputed");
    // (v2 - v1) = (1, 0, 0), (v3 - v1) = (0, 1, 0). Cross product is (0, 0, 1)
    TEST_ASSERT(std::abs(model.triangles[0].normal.x) < 1e-6, "Recomputed normal X should be 0");
    TEST_ASSERT(std::abs(model.triangles[0].normal.y) < 1e-6, "Recomputed normal Y should be 0");
    TEST_ASSERT(std::abs(model.triangles[0].normal.z - 1.0) < 1e-6, "Recomputed normal Z should be 1");
}

void test_stl_supplied_custom_normal_preserved() {
    // Vertices are in XY plane (geometric normal is 0, 0, 1)
    // Supplied normal is explicitly authored as (0, 1, 0)
    const std::string custom_normal_stl =
        "solid custom_normal\n"
        "  facet normal 0.0 1.0 0.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n"
        "  endfacet\n"
        "endsolid custom_normal\n";

    StlModel model = StlParser::parse_ascii(custom_normal_stl);
    TEST_ASSERT(model.is_valid, "Model should be valid");
    TEST_ASSERT(model.triangle_count == 1, "Should have 1 triangle");
    TEST_ASSERT(!model.triangles[0].normal_recomputed, "Supplied non-degenerate normal must be preserved as authored");
    TEST_ASSERT(std::abs(model.triangles[0].normal.x) < 1e-6, "Normal X should be 0");
    TEST_ASSERT(std::abs(model.triangles[0].normal.y - 1.0) < 1e-6, "Normal Y should be 1");
    TEST_ASSERT(std::abs(model.triangles[0].normal.z) < 1e-6, "Normal Z should be 0");
}

void test_stl_sample_bracket_file() {
    StlModel model = StlParser::parse_file(resolve_data_path("data/cad/sample_bracket.stl"));
    TEST_ASSERT(model.is_valid, "Sample bracket should parse successfully");
    TEST_ASSERT(model.triangle_count == 12, "Sample bracket must have 12 triangles");
    TEST_ASSERT(model.solid_name == "sample_bracket", "Solid name mismatch");
    TEST_ASSERT(model.bbox.is_valid(), "Bounding box should be valid");
    TEST_ASSERT(std::abs(model.bbox.min.x - 0.0) < 1e-6, "Min X should be 0.0");
    TEST_ASSERT(std::abs(model.bbox.max.x - 0.1) < 1e-6, "Max X should be 0.1");
    TEST_ASSERT(std::abs(model.bbox.min.y - 0.0) < 1e-6, "Min Y should be 0.0");
    TEST_ASSERT(std::abs(model.bbox.max.y - 0.1) < 1e-6, "Max Y should be 0.1");
    TEST_ASSERT(std::abs(model.bbox.min.z - 0.0) < 1e-6, "Min Z should be 0.0");
    TEST_ASSERT(std::abs(model.bbox.max.z - 0.05) < 1e-6, "Max Z should be 0.05");
}

void test_stl_binary_detection_null_bytes() {
    std::string fake_binary(200, '\0');
    fake_binary[0] = 's';
    fake_binary[1] = 'o';
    fake_binary[2] = 'l';
    fake_binary[3] = 'i';
    fake_binary[4] = 'd';
    fake_binary[80] = 1;

    bool caught = false;
    try {
        StlParser::parse_ascii(fake_binary);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Binary STL detected") != std::string::npos, "Error should report binary STL");
    }
    TEST_ASSERT(caught, "Should throw for binary STL");
}

void test_stl_binary_detection_printable_header() {
    // Valid binary STL layout: 80-byte header + uint32 triangle count + 50 bytes per triangle
    // Header contains ONLY printable ASCII characters starting with "solid " and space padding
    std::string header(80, ' ');
    std::string header_text = "solid Printable ASCII Header in Binary STL File";
    std::memcpy(&header[0], header_text.data(), header_text.size());

    uint32_t num_triangles = 1;
    std::vector<char> binary_file;
    binary_file.insert(binary_file.end(), header.begin(), header.end());
    const char* count_bytes = reinterpret_cast<const char*>(&num_triangles);
    binary_file.insert(binary_file.end(), count_bytes, count_bytes + 4);

    // 50 bytes of binary triangle: 12 floats normal + 3*12 floats vertices + 2 bytes attribute
    float normal[3] = {0.0f, 0.0f, 1.0f};
    float v1[3] = {0.0f, 0.0f, 0.0f};
    float v2[3] = {1.0f, 0.0f, 0.0f};
    float v3[3] = {0.0f, 1.0f, 0.0f};
    uint16_t attr = 0;

    auto append_bytes = [&binary_file](const void* src, size_t n) {
        const char* p = reinterpret_cast<const char*>(src);
        binary_file.insert(binary_file.end(), p, p + n);
    };

    append_bytes(normal, sizeof(normal));
    append_bytes(v1, sizeof(v1));
    append_bytes(v2, sizeof(v2));
    append_bytes(v3, sizeof(v3));
    append_bytes(&attr, sizeof(attr));

    TEST_ASSERT(binary_file.size() == 134, "Binary file size must be exactly 84 + 50 = 134 bytes");

    std::string_view sv(binary_file.data(), binary_file.size());
    bool caught = false;
    try {
        StlParser::parse_ascii(sv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Binary STL detected") != std::string::npos,
            "Must detect binary STL despite all-printable header");
    }
    TEST_ASSERT(caught, "Binary STL with printable header must be rejected");
}

void test_stl_utf8_bom_and_crlf() {
    // STL with UTF-8 BOM (\xEF\xBB\xBF) and Windows CRLF (\r\n) line endings
    const std::string bom_crlf_stl =
        "\xEF\xBB\xBFsolid bom_crlf\r\n"
        "  facet normal 0.0 0.0 1.0\r\n"
        "    outer loop\r\n"
        "      vertex 0.0 0.0 0.0\r\n"
        "      vertex 1.0 0.0 0.0\r\n"
        "      vertex 0.0 1.0 0.0\r\n"
        "    endloop\r\n"
        "  endfacet\r\n"
        "endsolid bom_crlf\r\n";

    StlModel model = StlParser::parse_ascii(bom_crlf_stl);
    TEST_ASSERT(model.is_valid, "BOM + CRLF model should parse successfully");
    TEST_ASSERT(model.solid_name == "bom_crlf", "Solid name mismatch");
    TEST_ASSERT(model.triangle_count == 1, "Should have 1 triangle");
}

void test_stl_zero_triangles_rejection() {
    const std::string empty_stl =
        "solid empty_solid\n"
        "endsolid empty_solid\n";

    bool caught = false;
    try {
        StlParser::parse_ascii(empty_stl);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("0 triangles") != std::string::npos, "Error should report 0 triangles");
    }
    TEST_ASSERT(caught, "Should reject 0-triangle STL");
}

void test_stl_empty_and_whitespace_rejection() {
    // 0-byte file
    bool caught1 = false;
    try {
        StlParser::parse_ascii("");
    } catch (const std::invalid_argument& e) {
        caught1 = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("empty") != std::string::npos, "0-byte reports empty");
    }
    TEST_ASSERT(caught1, "Should reject 0-byte STL");

    // Whitespace only
    bool caught2 = false;
    try {
        StlParser::parse_ascii("   \r\n\t  \n  ");
    } catch (const std::invalid_argument& e) {
        caught2 = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("empty") != std::string::npos, "Whitespace reports empty");
    }
    TEST_ASSERT(caught2, "Should reject whitespace-only STL");
}

void test_stl_truncated_eof_rejection() {
    // 1. Truncated after facet normal
    const std::string trunc_facet =
        "solid trunc\n"
        "  facet normal 0.0 0.0 1.0\n";
    bool caught1 = false;
    try {
        StlParser::parse_ascii(trunc_facet);
    } catch (const std::invalid_argument&) {
        caught1 = true;
    }
    TEST_ASSERT(caught1, "Should reject STL truncated after facet normal");

    // 2. Truncated inside vertex list (only 2 vertices)
    const std::string trunc_vert =
        "solid trunc\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n";
    bool caught2 = false;
    try {
        StlParser::parse_ascii(trunc_vert);
    } catch (const std::invalid_argument&) {
        caught2 = true;
    }
    TEST_ASSERT(caught2, "Should reject STL truncated inside vertex list");

    // 3. Truncated before endloop
    const std::string trunc_loop =
        "solid trunc\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n";
    bool caught3 = false;
    try {
        StlParser::parse_ascii(trunc_loop);
    } catch (const std::invalid_argument&) {
        caught3 = true;
    }
    TEST_ASSERT(caught3, "Should reject STL truncated before endloop");

    // 4. Truncated before endfacet
    const std::string trunc_endfacet =
        "solid trunc\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n";
    bool caught4 = false;
    try {
        StlParser::parse_ascii(trunc_endfacet);
    } catch (const std::invalid_argument&) {
        caught4 = true;
    }
    TEST_ASSERT(caught4, "Should reject STL truncated before endfacet");

    // 5. Truncated before endsolid
    const std::string trunc_endsolid =
        "solid trunc\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n"
        "  endfacet\n";
    bool caught5 = false;
    try {
        StlParser::parse_ascii(trunc_endsolid);
    } catch (const std::invalid_argument&) {
        caught5 = true;
    }
    TEST_ASSERT(caught5, "Should reject STL truncated before endsolid");
}

void test_stl_malformed_grammar_rejection() {
    const std::string bad_loop =
        "solid bad_loop\n"
        "  facet normal 0.0 0.0 1.0\n"
        "      vertex 0.0 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "  endfacet\n"
        "endsolid bad_loop\n";

    bool caught = false;
    try {
        StlParser::parse_ascii(bad_loop);
    } catch (const std::invalid_argument&) {
        caught = true;
    }
    TEST_ASSERT(caught, "Should reject missing outer loop");
}

void test_stl_non_finite_coordinates_rejection() {
    const std::string nan_stl =
        "solid nan_solid\n"
        "  facet normal 0.0 0.0 1.0\n"
        "    outer loop\n"
        "      vertex NaN 0.0 0.0\n"
        "      vertex 1.0 0.0 0.0\n"
        "      vertex 0.0 1.0 0.0\n"
        "    endloop\n"
        "  endfacet\n"
        "endsolid nan_solid\n";

    bool caught = false;
    try {
        StlParser::parse_ascii(nan_stl);
    } catch (const std::invalid_argument&) {
        caught = true;
    }
    TEST_ASSERT(caught, "Should reject NaN coordinates");
}

void test_stl_file_size_limit_rejection() {
    // Exactly 10 MB + 1 byte
    std::string oversized(MAX_FILE_SIZE_BYTES + 1, 'a');
    bool caught = false;
    try {
        StlParser::parse_ascii(oversized);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("exceeds maximum file size limit of 10 MB") != std::string::npos,
            "Error reports 10 MB limit exceeded");
    }
    TEST_ASSERT(caught, "Oversized STL (>10 MB) must be rejected");
}

void test_stl_max_triangles_boundary() {
    // Test 50,001 triangles (one over limit of 50,000)
    std::ostringstream ss;
    ss << "solid triangle_limit\n";
    for (size_t i = 0; i <= MAX_STL_TRIANGLES; ++i) { // 50,001 triangles
        ss << "  facet normal 0.0 0.0 1.0\n"
           << "    outer loop\n"
           << "      vertex 0.0 0.0 0.0\n"
           << "      vertex 1.0 0.0 0.0\n"
           << "      vertex 0.0 1.0 0.0\n"
           << "    endloop\n"
           << "  endfacet\n";
    }
    ss << "endsolid triangle_limit\n";

    std::string over_limit_str = ss.str();
    bool caught = false;
    try {
        StlParser::parse_ascii(over_limit_str);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("exceeds maximum allowed limit of 50000 triangles") != std::string::npos,
            "Error reports 50000 triangle limit exceeded");
    }
    TEST_ASSERT(caught, "50,001 triangles must be rejected");
}

// ---------------- CSV Parser Tests ----------------

void test_csv_valid_in_memory() {
    const std::string valid_csv =
        "# Provenance: Synthetic analytical test data\n"
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,0.0,0.0,25.0\n"
        "2,0.1,0.0,0.0,35.0\n"
        "3,0.1,0.05,0.02,45.0\n";

    TemperatureDataset ds = CsvParser::parse_csv(valid_csv);
    TEST_ASSERT(ds.is_valid, "Dataset should be valid");
    TEST_ASSERT(ds.node_count == 3, "Node count should be 3");
    TEST_ASSERT(ds.nodes.size() == 3, "Nodes vector size mismatch");
    TEST_ASSERT(ds.is_synthetic, "Synthetic provenance should be detected from comment");
    TEST_ASSERT(std::abs(ds.min_temperature_C - 25.0) < 1e-6, "Min temp mismatch");
    TEST_ASSERT(std::abs(ds.max_temperature_C - 45.0) < 1e-6, "Max temp mismatch");
    TEST_ASSERT(std::abs(ds.avg_temperature_C - 35.0) < 1e-6, "Avg temp mismatch");

    TEST_ASSERT(ds.bbox.is_valid(), "Bounding box should be valid");
    TEST_ASSERT(std::abs(ds.bbox.min.x - 0.0) < 1e-6, "BBox min X mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.x - 0.1) < 1e-6, "BBox max X mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.y - 0.05) < 1e-6, "BBox max Y mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.z - 0.02) < 1e-6, "BBox max Z mismatch");
}

void test_csv_rfc4180_quoting() {
    const std::string quoted_csv =
        "\"node_id\",\"x_m\",\"y_m\",\"z_m\",\"temperature_C\"\n"
        "\"101\", \"0.01\", \"0.02\", \"0.03\", \"88.5\"\n"
        "102, 0.05, 0.05, 0.01, \"99.0\"\n";

    TemperatureDataset ds = CsvParser::parse_csv(quoted_csv);
    TEST_ASSERT(ds.is_valid, "Dataset should be valid");
    TEST_ASSERT(ds.node_count == 2, "Node count should be 2");
    TEST_ASSERT(ds.nodes[0].node_id == 101, "Quoted node_id parsed incorrectly");
    TEST_ASSERT(std::abs(ds.nodes[0].temperature_C - 88.5) < 1e-6, "Quoted temp parsed incorrectly");
    TEST_ASSERT(ds.nodes[1].node_id == 102, "Node 102 mismatch");
}

void test_csv_synthetic_point_cloud_file() {
    TemperatureDataset ds = CsvParser::parse_file(resolve_data_path("data/ansys/synthetic_temperature_point_cloud.csv"));
    TEST_ASSERT(ds.is_valid, "Synthetic CSV file should parse successfully");
    TEST_ASSERT(ds.node_count == 125, "Synthetic dataset must contain 125 nodes");
    TEST_ASSERT(ds.is_synthetic, "Synthetic flag must be true");
    TEST_ASSERT(std::abs(ds.min_temperature_C - 10.0) < 1e-4, "Min temperature should be 10.0 C");
    TEST_ASSERT(std::abs(ds.max_temperature_C - 165.0) < 1e-4, "Max temperature should be 165.0 C");
    TEST_ASSERT(std::abs(ds.avg_temperature_C - 107.4142) < 1e-3, "Avg temperature should be 107.4142 C");

    TEST_ASSERT(ds.bbox.is_valid(), "Bounding box should be valid");
    TEST_ASSERT(std::abs(ds.bbox.min.x - 0.0) < 1e-6, "Min X mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.x - 0.1) < 1e-6, "Max X mismatch");
    TEST_ASSERT(std::abs(ds.bbox.min.y - 0.0) < 1e-6, "Min Y mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.y - 0.1) < 1e-6, "Max Y mismatch");
    TEST_ASSERT(std::abs(ds.bbox.min.z - 0.0) < 1e-6, "Min Z mismatch");
    TEST_ASSERT(std::abs(ds.bbox.max.z - 0.05) < 1e-6, "Max Z mismatch");
}

void test_csv_utf8_bom_and_crlf() {
    const std::string bom_crlf_csv =
        "\xEF\xBB\xBFnode_id,x_m,y_m,z_m,temperature_C\r\n"
        "1,0.0,0.0,0.0,20.0\r\n"
        "2,0.1,0.0,0.0,30.0\r\n";

    TemperatureDataset ds = CsvParser::parse_csv(bom_crlf_csv);
    TEST_ASSERT(ds.is_valid, "CSV with BOM and CRLF should parse successfully");
    TEST_ASSERT(ds.node_count == 2, "Node count should be 2");
    TEST_ASSERT(ds.nodes[0].node_id == 1, "Node 1 mismatch");
    TEST_ASSERT(ds.nodes[1].node_id == 2, "Node 2 mismatch");
}

void test_csv_duplicate_node_id_rejection() {
    const std::string dup_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,0.0,0.0,25.0\n"
        "2,0.1,0.0,0.0,30.0\n"
        "1,0.2,0.0,0.0,35.0\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(dup_csv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Duplicate node_id 1") != std::string::npos, "Error should report duplicate node_id");
    }
    TEST_ASSERT(caught, "Should reject duplicate node IDs");
}

void test_csv_node_id_overflow_rejection() {
    const std::string overflow_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "999999999999999999999999999999,0.0,0.0,0.0,25.0\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(overflow_csv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Invalid node_id") != std::string::npos, "Error reports invalid node_id on overflow");
    }
    TEST_ASSERT(caught, "Should reject node_id integer overflow");
}

void test_csv_extra_columns_rejection() {
    const std::string extra_col_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,0.0,0.0,25.0,extra_val\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(extra_col_csv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Expected exactly 5 columns, found 6") != std::string::npos,
            "Error reports extra columns");
    }
    TEST_ASSERT(caught, "Should reject CSV rows with extra columns");
}

void test_csv_missing_columns_rejection() {
    const std::string missing_col_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,0.0,25.0\n"; // Only 4 columns

    bool caught = false;
    try {
        CsvParser::parse_csv(missing_col_csv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Expected exactly 5 columns, found 4") != std::string::npos,
            "Error reports missing columns");
    }
    TEST_ASSERT(caught, "Should reject CSV rows with missing columns");
}

void test_csv_unphysical_temperature_rejection() {
    const std::string sub_zero_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,0.0,0.0,-275.0\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(sub_zero_csv);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("absolute zero") != std::string::npos, "Error should report absolute zero violation");
    }
    TEST_ASSERT(caught, "Should reject temperatures below -273.15 C");
}

void test_csv_invalid_header_rejection() {
    const std::string wrong_header =
        "node,x,y,z,temp\n"
        "1,0.0,0.0,0.0,25.0\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(wrong_header);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("Invalid CSV header") != std::string::npos, "Error should report invalid header");
    }
    TEST_ASSERT(caught, "Should reject non-conforming header");
}

void test_csv_empty_and_whitespace_rejection() {
    // 0-byte file
    bool caught1 = false;
    try {
        CsvParser::parse_csv("");
    } catch (const std::invalid_argument& e) {
        caught1 = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("empty") != std::string::npos, "0-byte reports empty");
    }
    TEST_ASSERT(caught1, "Should reject 0-byte CSV");

    // Whitespace only
    bool caught2 = false;
    try {
        CsvParser::parse_csv("   \r\n\t  \n  ");
    } catch (const std::invalid_argument& e) {
        caught2 = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("empty") != std::string::npos, "Whitespace reports empty");
    }
    TEST_ASSERT(caught2, "Should reject whitespace-only CSV");
}

void test_csv_zero_data_rows_rejection() {
    const std::string header_only =
        "node_id,x_m,y_m,z_m,temperature_C\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(header_only);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("zero data rows") != std::string::npos, "Error should report zero data rows");
    }
    TEST_ASSERT(caught, "Should reject CSV with zero rows");
}

void test_csv_non_finite_rejection() {
    const std::string nan_csv =
        "node_id,x_m,y_m,z_m,temperature_C\n"
        "1,0.0,NaN,0.0,25.0\n";

    bool caught = false;
    try {
        CsvParser::parse_csv(nan_csv);
    } catch (const std::invalid_argument&) {
        caught = true;
    }
    TEST_ASSERT(caught, "Should reject NaN coordinates in CSV");
}

void test_csv_file_size_limit_rejection() {
    // Exactly 10 MB + 1 byte
    std::string oversized(MAX_FILE_SIZE_BYTES + 1, 'a');
    bool caught = false;
    try {
        CsvParser::parse_csv(oversized);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("exceeds maximum file size limit of 10 MB") != std::string::npos,
            "Error reports 10 MB limit exceeded");
    }
    TEST_ASSERT(caught, "Oversized CSV (>10 MB) must be rejected");
}

void test_csv_max_records_boundary() {
    // Test 100,001 rows (one over limit of 100,000)
    std::ostringstream ss;
    ss << "node_id,x_m,y_m,z_m,temperature_C\n";
    for (size_t i = 0; i <= MAX_CSV_RECORDS; ++i) { // 100,001 rows
        ss << i << ",0.0,0.0,0.0,25.0\n";
    }

    std::string over_limit_str = ss.str();
    bool caught = false;
    try {
        CsvParser::parse_csv(over_limit_str);
    } catch (const std::invalid_argument& e) {
        caught = true;
        std::string msg = e.what();
        TEST_ASSERT(msg.find("exceeds maximum allowed limit of 100000 rows") != std::string::npos,
            "Error reports 100000 rows limit exceeded");
    }
    TEST_ASSERT(caught, "100,001 rows must be rejected");
}

int main() {
    std::cout << "========================================\n";
    std::cout << "UEW CAD / ANSYS Data Parser Unit Tests\n";
    std::cout << "========================================\n";

    // STL tests
    run_test("STL - Valid In-Memory Parsing", test_stl_valid_in_memory);
    run_test("STL - Degenerate Normal Recomputation", test_stl_degenerate_normal_recomputation);
    run_test("STL - Supplied Custom Normal Preserved", test_stl_supplied_custom_normal_preserved);
    run_test("STL - Sample Bracket File Parsing", test_stl_sample_bracket_file);
    run_test("STL - Binary STL Detection (Null Bytes)", test_stl_binary_detection_null_bytes);
    run_test("STL - Binary STL Detection (Printable Header)", test_stl_binary_detection_printable_header);
    run_test("STL - UTF-8 BOM and Windows CRLF Parsing", test_stl_utf8_bom_and_crlf);
    run_test("STL - Zero Triangles Rejection", test_stl_zero_triangles_rejection);
    run_test("STL - Empty and Whitespace Content Rejection", test_stl_empty_and_whitespace_rejection);
    run_test("STL - Truncated File at Unexpected EOF Rejection", test_stl_truncated_eof_rejection);
    run_test("STL - Malformed Grammar Rejection", test_stl_malformed_grammar_rejection);
    run_test("STL - Non-Finite Coordinates Rejection", test_stl_non_finite_coordinates_rejection);
    run_test("STL - 10 MB File Size Cap Rejection", test_stl_file_size_limit_rejection);
    run_test("STL - 50,000 Triangle Cap Boundary Check", test_stl_max_triangles_boundary);

    // CSV tests
    run_test("CSV - Valid In-Memory Parsing", test_csv_valid_in_memory);
    run_test("CSV - RFC 4180 Quoting and Trimming", test_csv_rfc4180_quoting);
    run_test("CSV - Synthetic Point Cloud File Parsing", test_csv_synthetic_point_cloud_file);
    run_test("CSV - UTF-8 BOM and Windows CRLF Parsing", test_csv_utf8_bom_and_crlf);
    run_test("CSV - Duplicate Node ID Rejection", test_csv_duplicate_node_id_rejection);
    run_test("CSV - Node ID Integer Overflow Rejection", test_csv_node_id_overflow_rejection);
    run_test("CSV - Extra Columns (6 cols) Rejection", test_csv_extra_columns_rejection);
    run_test("CSV - Missing Columns (4 cols) Rejection", test_csv_missing_columns_rejection);
    run_test("CSV - Unphysical Temperature (< -273.15 C) Rejection", test_csv_unphysical_temperature_rejection);
    run_test("CSV - Invalid Header Rejection", test_csv_invalid_header_rejection);
    run_test("CSV - Empty and Whitespace Content Rejection", test_csv_empty_and_whitespace_rejection);
    run_test("CSV - Zero Data Rows Rejection", test_csv_zero_data_rows_rejection);
    run_test("CSV - Non-Finite Values Rejection", test_csv_non_finite_rejection);
    run_test("CSV - 10 MB File Size Cap Rejection", test_csv_file_size_limit_rejection);
    run_test("CSV - 100,000 Record Cap Boundary Check", test_csv_max_records_boundary);

    std::cout << "\n========================================\n";
    std::cout << "Parser Test Summary: " << g_tests_passed << " / " << g_tests_run << " passed.\n";
    std::cout << "========================================\n";

    return (g_tests_passed == g_tests_run) ? 0 : 1;
}
