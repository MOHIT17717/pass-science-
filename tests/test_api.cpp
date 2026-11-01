#include "api/Json.h"
#include "api/HttpServer.h"
#include "api/ApiRouter.h"
#include <iostream>
#include <sstream>
#include <vector>
#include <thread>
#include <atomic>
#include <chrono>
#include <stdexcept>

#ifdef _WIN32
#ifndef WIN32_LEAN_AND_MEAN
#define WIN32_LEAN_AND_MEAN
#endif
#ifndef NOMINMAX
#define NOMINMAX
#endif
#include <windows.h>
#include <winsock2.h>
#include <ws2tcpip.h>
#else
#include <sys/socket.h>
#include <arpa/inet.h>
#include <unistd.h>
#endif

using namespace uew::api;

#define TEST_ASSERT(cond, msg) \
    do { \
        if (!(cond)) { \
            std::cerr << "\n[TEST FAILURE] " << (msg) << " (" << __FILE__ << ":" << __LINE__ << ")\n"; \
            throw std::runtime_error(std::string("Assertion failed: ") + (msg)); \
        } \
    } while (0)

static std::string http_raw_exchange(int port, const std::string& raw_request) {
    socket_t sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (sock == static_cast<socket_t>(~0)) return "";

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(static_cast<uint16_t>(port));

    int res = connect(sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
    if (res != 0) {
#ifdef _WIN32
        closesocket(sock);
#else
        close(sock);
#endif
        return "";
    }

    send(sock, raw_request.data(), static_cast<int>(raw_request.size()), 0);

    std::string response;
    char buf[2048];
    int bytes = 0;
    while ((bytes = recv(sock, buf, sizeof(buf) - 1, 0)) > 0) {
        buf[bytes] = '\0';
        response.append(buf, bytes);
    }

#ifdef _WIN32
    closesocket(sock);
#else
    close(sock);
#endif
    return response;
}

static std::string http_get(int port, const std::string& path, const std::string& token = "") {
    std::ostringstream req;
    req << "GET " << path << " HTTP/1.1\r\n";
    req << "Host: 127.0.0.1:" << port << "\r\n";
    if (!token.empty()) {
        req << "X-Session-Token: " << token << "\r\n";
    }
    req << "Connection: close\r\n\r\n";
    return http_raw_exchange(port, req.str());
}

static std::string http_post(int port, const std::string& path, const std::string& body, const std::string& token = "", const std::string& content_type = "text/plain") {
    std::ostringstream req;
    req << "POST " << path << " HTTP/1.1\r\n";
    req << "Host: 127.0.0.1:" << port << "\r\n";
    if (!token.empty()) {
        req << "X-Session-Token: " << token << "\r\n";
    }
    req << "Content-Type: " << content_type << "\r\n";
    req << "Content-Length: " << body.size() << "\r\n";
    req << "Connection: close\r\n\r\n";
    req << body;
    return http_raw_exchange(port, req.str());
}

void test_json_roundtrip() {
    Json root;
    root["name"] = "UnifiedEngineeringWorkbench";
    root["version"] = "0.1.0";
    root["cores"] = 12;
    root["active"] = true;

    std::vector<Json> tags = {Json("thermal"), Json("geometry"), Json("fem")};
    root["tags"] = tags;

    std::string serialized = root.serialize();
    TEST_ASSERT(serialized.find("\"name\":\"UnifiedEngineeringWorkbench\"") != std::string::npos, "Serialized name");
    TEST_ASSERT(serialized.find("\"cores\":12") != std::string::npos, "Serialized cores");
    TEST_ASSERT(serialized.find("\"active\":true") != std::string::npos, "Serialized active");

    Json parsed = Json::parse(serialized);
    TEST_ASSERT(parsed["name"].as_string() == "UnifiedEngineeringWorkbench", "Parsed name");
    TEST_ASSERT(parsed["cores"].as_int() == 12, "Parsed cores");
    TEST_ASSERT(parsed["active"].as_bool() == true, "Parsed active");
    TEST_ASSERT(parsed["tags"].as_array().size() == 3, "Parsed tags length");
    TEST_ASSERT(parsed["tags"][1].as_string() == "geometry", "Parsed tag item");
    std::cout << "PASS: JSON serialization and parsing roundtrip verified." << std::endl;
}

void test_constant_time_comparison() {
    const std::string expected_64 = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // 1. Correct 64-character token
    std::string correct_token = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    TEST_ASSERT(HttpServer::constant_time_equals(correct_token, expected_64) == true,
        "1. Correct 64-character token matches");

    // 2. Same-length incorrect token
    std::string same_len_bad = "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";
    TEST_ASSERT(HttpServer::constant_time_equals(same_len_bad, expected_64) == false,
        "2. Same-length incorrect token rejected");

    // 3. Incorrect first character
    std::string bad_first = "x123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    TEST_ASSERT(HttpServer::constant_time_equals(bad_first, expected_64) == false,
        "3. Incorrect first character rejected");

    // 4. Incorrect final character
    std::string bad_final = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdeg";
    TEST_ASSERT(HttpServer::constant_time_equals(bad_final, expected_64) == false,
        "4. Incorrect final character rejected");

    // 5. Shorter token (< 64 chars)
    std::string shorter_token = "0123456789abcdef0123456789abcdef";
    TEST_ASSERT(HttpServer::constant_time_equals(shorter_token, expected_64) == false,
        "5. Shorter token rejected");

    // 6. Longer token (> 64 chars)
    std::string longer_token = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdefextra";
    TEST_ASSERT(HttpServer::constant_time_equals(longer_token, expected_64) == false,
        "6. Longer token rejected");

    // 7. Empty token
    std::string empty_token = "";
    TEST_ASSERT(HttpServer::constant_time_equals(empty_token, expected_64) == false,
        "7. Empty token rejected");

    std::cout << "PASS: All 7 token comparison cases verified (constant-time 64-character mitigation)." << std::endl;
}

void test_api_lifecycle_and_validation() {
    const std::string test_token = "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";

    // 1. Start server on dynamic port (0) with auth required but NOT initialized
    HttpServer server(0);
    server.set_require_auth(true);
    ApiRouter::register_routes(server);

    bool started = server.start(false);
    TEST_ASSERT(started, "Server started successfully on port 0");
    int port = server.get_bound_port();
    TEST_ASSERT(port > 0, "Server bound to valid dynamic port > 0");
    std::cout << "INFO: Dynamic loopback port assigned: " << port << std::endl;

    // Test A: Request BEFORE token initialization -> Expect 503 Service Unavailable
    std::string resp_pre_init = http_get(port, "/api/v1/health", test_token);
    TEST_ASSERT(resp_pre_init.find("503 Service Unavailable") != std::string::npos, "Pre-handshake returns 503");
    std::cout << "PASS: Pre-handshake request returned 503 Service Unavailable." << std::endl;

    // Simulate token handshake initialization
    server.set_auth_token(test_token);
    TEST_ASSERT(server.is_auth_initialized(), "Token initialized successfully");

    // Test B: Request with NO token -> Expect 401 Unauthorized
    std::string resp_no_auth = http_get(port, "/api/v1/health", "");
    TEST_ASSERT(resp_no_auth.find("401 Unauthorized") != std::string::npos, "Missing token returns 401");
    std::cout << "PASS: Missing token returned 401 Unauthorized." << std::endl;

    // Test C: Request with WRONG token -> Expect 401 Unauthorized
    std::string resp_bad_auth = http_get(port, "/api/v1/health", "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210");
    TEST_ASSERT(resp_bad_auth.find("401 Unauthorized") != std::string::npos, "Invalid token returns 401");
    std::cout << "PASS: Invalid token returned 401 Unauthorized." << std::endl;

    // Test D: Request with VALID token -> Expect 200 OK and explicit units JSON
    std::string resp_ok = http_get(port, "/api/v1/health", test_token);
    TEST_ASSERT(resp_ok.find("200 OK") != std::string::npos, "Valid token returns 200 OK");
    size_t body_pos = resp_ok.find("\r\n\r\n");
    TEST_ASSERT(body_pos != std::string::npos, "Response contains valid HTTP delimiter");
    Json health_json = Json::parse(resp_ok.substr(body_pos + 4));
    TEST_ASSERT(health_json["status"].as_string() == "ok", "Health status ok");
    TEST_ASSERT(health_json["core_ready"].as_bool() == true, "Core ready true");
    TEST_ASSERT(health_json["units"]["temperature"].as_string() == "degC", "Explicit units temperature");
    TEST_ASSERT(health_json["units"]["thermal_conductivity"].as_string() == "W/(m*K)", "Explicit units conductivity");
    std::cout << "PASS: Valid token returned 200 OK with explicit physical units." << std::endl;

    // Test D1: Thermal Solve Endpoint (POST valid elements=80) -> Expect 200 OK with accurate solution
    std::string post_solve_body;
    {
        std::string body = "{\"elements\": 80}";
        std::ostringstream req;
        req << "POST /api/v1/thermal/solve HTTP/1.1\r\n"
            << "Host: 127.0.0.1:" << port << "\r\n"
            << "X-Session-Token: " << test_token << "\r\n"
            << "Content-Type: application/json\r\n"
            << "Content-Length: " << body.size() << "\r\n"
            << "Connection: close\r\n\r\n"
            << body;
        std::string resp = http_raw_exchange(port, req.str());
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal solve POST returns 200 OK");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        post_solve_body = resp.substr(b_pos + 4);
        Json j = Json::parse(post_solve_body);
        TEST_ASSERT(j["status"].as_string() == "ok", "Thermal status ok");
        TEST_ASSERT(j["problem"]["area_m2"].as_number() == 0.0001, "Cross-sectional area is 0.0001 m^2");
        TEST_ASSERT(j.contains("analytical_curve"), "Response contains analytical_curve");
        TEST_ASSERT(j["analytical_curve"]["sample_count"].as_int() == 201, "Analytical curve has 201 samples");
        TEST_ASSERT(j["mesh"]["elements"].as_int() == 80, "Elements == 80");
        TEST_ASSERT(j["mesh"]["node_count"].as_int() == 81, "Node count == 81");
        TEST_ASSERT(j["mesh"]["midpoints"].as_array().size() == 80, "Midpoint array size == 80");
        double mid_err = j["mesh"]["max_midpoint_error_C"].as_number();
        TEST_ASSERT(std::abs(mid_err - 0.01953125) < 1e-7, "Thermal 80-element midpoint error == 0.01953125 C");
        std::cout << "PASS: Thermal solve API (POST) verified with 80-element mesh (midpoint error: " << mid_err << " C)." << std::endl;
    }

    // Test D2: Thermal Solve Endpoint (GET query param elements=80) -> Consistent with POST
    {
        std::string resp = http_get(port, "/api/v1/thermal/solve?elements=80", test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal solve GET returns 200 OK");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        std::string get_solve_body = resp.substr(b_pos + 4);
        Json j_get = Json::parse(get_solve_body);
        Json j_post = Json::parse(post_solve_body);
        TEST_ASSERT(j_get["mesh"]["elements"].as_int() == j_post["mesh"]["elements"].as_int(), "GET and POST equivalent elements");
        TEST_ASSERT(std::abs(j_get["mesh"]["max_midpoint_error_C"].as_number() - j_post["mesh"]["max_midpoint_error_C"].as_number()) < 1e-12,
            "GET and POST equivalent midpoint error");
        std::cout << "PASS: Thermal solve GET and POST consistency verified." << std::endl;
    }

    // Test D3: Thermal Solve Endpoint (invalid elements=15) -> Expect 400 Bad Request
    {
        std::string body = "{\"elements\": 15}";
        std::ostringstream req;
        req << "POST /api/v1/thermal/solve HTTP/1.1\r\n"
            << "Host: 127.0.0.1:" << port << "\r\n"
            << "X-Session-Token: " << test_token << "\r\n"
            << "Content-Type: application/json\r\n"
            << "Content-Length: " << body.size() << "\r\n"
            << "Connection: close\r\n\r\n"
            << body;
        std::string resp = http_raw_exchange(port, req.str());
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Invalid elements returns 400 Bad Request");
        TEST_ASSERT(resp.find("Allowed mesh counts are 10, 20, 40, and 80") != std::string::npos,
            "400 Bad Request has actionable details");
        std::cout << "PASS: Thermal solve API rejected invalid mesh elements=15 with 400 Bad Request." << std::endl;
    }

    // Test D4: Thermal Solve Endpoint (malformed JSON) -> Expect 400 Bad Request
    {
        std::string body = "{ bad json ";
        std::ostringstream req;
        req << "POST /api/v1/thermal/solve HTTP/1.1\r\n"
            << "Host: 127.0.0.1:" << port << "\r\n"
            << "X-Session-Token: " << test_token << "\r\n"
            << "Content-Type: application/json\r\n"
            << "Content-Length: " << body.size() << "\r\n"
            << "Connection: close\r\n\r\n"
            << body;
        std::string resp = http_raw_exchange(port, req.str());
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Malformed JSON returns 400 Bad Request");
        std::cout << "PASS: Thermal solve API rejected malformed JSON with 400 Bad Request." << std::endl;
    }

    // Test D5: Thermal Solve Endpoint (non-numeric elements) -> Expect 400 Bad Request
    {
        std::string body = "{\"elements\": \"eighty\"}";
        std::ostringstream req;
        req << "POST /api/v1/thermal/solve HTTP/1.1\r\n"
            << "Host: 127.0.0.1:" << port << "\r\n"
            << "X-Session-Token: " << test_token << "\r\n"
            << "Content-Type: application/json\r\n"
            << "Content-Length: " << body.size() << "\r\n"
            << "Connection: close\r\n\r\n"
            << body;
        std::string resp = http_raw_exchange(port, req.str());
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Non-integer elements returns 400 Bad Request");
        std::cout << "PASS: Thermal solve API rejected non-integer elements with 400 Bad Request." << std::endl;
    }

    // Test D6: Thermal Export Midpoint CSV (GET type=midpoint) -> Expect 200 OK, 80 midpoint records
    std::string get_mid_csv;
    {
        std::string resp = http_get(port, "/api/v1/thermal/export?elements=80&type=midpoint", test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal export GET returns 200 OK");
        TEST_ASSERT(resp.find("Content-Type: text/csv; charset=utf-8") != std::string::npos, "Content-Type text/csv");
        TEST_ASSERT(resp.find("Content-Disposition: attachment; filename=\"thermal_mesh_80_midpoint.csv\"") != std::string::npos,
            "Content-Disposition attachment");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        get_mid_csv = resp.substr(b_pos + 4);
        TEST_ASSERT(get_mid_csv.find("element_id,midpoint_position_m,interpolated_fem_temperature_C,analytical_temperature_C,midpoint_error_C") != std::string::npos,
            "Midpoint CSV contains exact columns");
        TEST_ASSERT(get_mid_csv.find("# Maximum Midpoint Error: 0.01953125 degC") != std::string::npos,
            "Midpoint CSV contains 0.01953125 degC metadata");
        std::istringstream stream(get_mid_csv);
        std::string line;
        int count = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#' || line.rfind("element_id", 0) == 0) continue;
            ++count;
            TEST_ASSERT(line.find("0.01953125") != std::string::npos, "Every midpoint row has error 0.01953125");
        }
        TEST_ASSERT(count == 80, "Midpoint CSV contains exactly 80 records for N=80");
        std::cout << "PASS: Thermal export midpoint CSV (GET) verified (80 midpoint rows, error=0.01953125 C)." << std::endl;
    }

    // Test D7: Thermal Export Midpoint CSV (POST type=midpoint) -> Consistent with GET
    {
        std::string body = "{\"elements\": 80, \"type\": \"midpoint\"}";
        std::ostringstream req;
        req << "POST /api/v1/thermal/export HTTP/1.1\r\n"
            << "Host: 127.0.0.1:" << port << "\r\n"
            << "X-Session-Token: " << test_token << "\r\n"
            << "Content-Type: application/json\r\n"
            << "Content-Length: " << body.size() << "\r\n"
            << "Connection: close\r\n\r\n"
            << body;
        std::string resp = http_raw_exchange(port, req.str());
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal export POST returns 200 OK");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        std::string post_mid_csv = resp.substr(b_pos + 4);
        TEST_ASSERT(post_mid_csv == get_mid_csv, "GET and POST produce identical CSV body");
        std::cout << "PASS: Thermal export CSV GET and POST consistency verified." << std::endl;
    }

    // Test D8: Thermal Export Nodal CSV (GET type=nodal) -> 81 node records
    {
        std::string resp = http_get(port, "/api/v1/thermal/export?elements=80&type=nodal", test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal export nodal returns 200 OK");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        std::string nodal_csv = resp.substr(b_pos + 4);
        TEST_ASSERT(nodal_csv.find("node_id,position_m,fem_temperature_C,analytical_temperature_C,error_C") != std::string::npos,
            "Nodal CSV contains exact columns");
        std::istringstream stream(nodal_csv);
        std::string line;
        int count = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#' || line.rfind("node_id", 0) == 0) continue;
            ++count;
        }
        TEST_ASSERT(count == 81, "Nodal CSV contains exactly 81 records for N=80");
        std::cout << "PASS: Thermal export nodal CSV verified with 81 rows." << std::endl;
    }

    // Test D9: Thermal Export Combined CSV (GET type=combined) -> 161 records (81 nodes + 80 midpoints)
    {
        std::string resp = http_get(port, "/api/v1/thermal/export?elements=80&type=combined", test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Thermal export combined returns 200 OK");
        size_t b_pos = resp.find("\r\n\r\n");
        TEST_ASSERT(b_pos != std::string::npos, "Delimiter found");
        std::string comb_csv = resp.substr(b_pos + 4);
        TEST_ASSERT(comb_csv.find("record_type,index,position_m,fem_temperature_C,analytical_temperature_C,error_C") != std::string::npos,
            "Combined CSV contains record_type column");
        std::istringstream stream(comb_csv);
        std::string line;
        int node_rows = 0, mid_rows = 0;
        while (std::getline(stream, line)) {
            if (!line.empty() && line.back() == '\r') line.pop_back();
            if (line.empty() || line[0] == '#') continue;
            if (line.rfind("node,", 0) == 0) ++node_rows;
            if (line.rfind("midpoint,", 0) == 0) ++mid_rows;
        }
        TEST_ASSERT(node_rows == 81, "Combined CSV has 81 node records");
        TEST_ASSERT(mid_rows == 80, "Combined CSV has 80 midpoint records");
        std::cout << "PASS: Thermal export combined CSV verified with 161 total records (81 nodes + 80 midpoints)." << std::endl;
    }

    // Test D10: Thermal Export Invalid Elements (elements=15) -> Expect 400 Bad Request
    {
        std::string resp = http_get(port, "/api/v1/thermal/export?elements=15", test_token);
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Invalid elements returns 400 Bad Request");
        std::cout << "PASS: Thermal export rejected invalid elements=15 with 400 Bad Request." << std::endl;
    }

    // Test D11: Thermal Export Invalid Type (type=invalid) -> Expect 400 Bad Request
    {
        std::string resp = http_get(port, "/api/v1/thermal/export?elements=80&type=invalid_type", test_token);
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Invalid type returns 400 Bad Request");
        std::cout << "PASS: Thermal export rejected invalid type with 400 Bad Request." << std::endl;
    }

    // Test D12: Unauthenticated Thermal Endpoints -> Expect 401 Unauthorized
    {
        std::string resp1 = http_get(port, "/api/v1/thermal/solve?elements=80", "");
        TEST_ASSERT(resp1.find("401 Unauthorized") != std::string::npos, "Unauthenticated solve returns 401");
        std::string resp2 = http_get(port, "/api/v1/thermal/export?elements=80", "");
        TEST_ASSERT(resp2.find("401 Unauthorized") != std::string::npos, "Unauthenticated export returns 401");
        std::cout << "PASS: Unauthenticated requests to thermal endpoints strictly rejected with 401 Unauthorized." << std::endl;
    }

    // Test D13: Geometry parse-stl endpoint (POST /api/v1/geometry/parse-stl)
    {
        const std::string valid_stl =
            "solid box\n"
            "  facet normal 0.0 0.0 1.0\n"
            "    outer loop\n"
            "      vertex 0.0 0.0 0.0\n"
            "      vertex 1.0 0.0 0.0\n"
            "      vertex 0.0 1.0 0.0\n"
            "    endloop\n"
            "  endfacet\n"
            "endsolid box\n";
        std::string resp = http_post(port, "/api/v1/geometry/parse-stl", valid_stl, test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Parse-stl returns 200 OK");
        TEST_ASSERT(resp.find("\"solid_name\":\"box\"") != std::string::npos, "Parse-stl solid_name");
        TEST_ASSERT(resp.find("\"triangle_count\":1") != std::string::npos, "Parse-stl triangle_count");
        TEST_ASSERT(resp.find("\"positions\":[") != std::string::npos, "Parse-stl contains positions array");
        TEST_ASSERT(resp.find("\"normals\":[") != std::string::npos, "Parse-stl contains normals array");
        std::cout << "PASS: Geometry parse-stl endpoint verified with 200 OK and BufferGeometry data." << std::endl;
    }

    // Test D14: Geometry parse-stl rejected on binary data (400 Bad Request)
    {
        std::string fake_binary(128, '\0');
        fake_binary[0] = 's'; fake_binary[1] = 'o'; fake_binary[2] = 'l'; fake_binary[3] = 'i'; fake_binary[4] = 'd';
        std::string resp = http_post(port, "/api/v1/geometry/parse-stl", fake_binary, test_token);
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Binary STL returns 400 Bad Request");
        TEST_ASSERT(resp.find("Binary STL detected") != std::string::npos, "Binary STL diagnostic error");
        std::cout << "PASS: Geometry parse-stl rejected binary data with 400 Bad Request." << std::endl;
    }

    // Test D15: Geometry parse-stl rejected on 0-triangle STL (400 Bad Request)
    {
        std::string empty_stl = "solid empty\nendsolid empty\n";
        std::string resp = http_post(port, "/api/v1/geometry/parse-stl", empty_stl, test_token);
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "0-triangle STL returns 400 Bad Request");
        TEST_ASSERT(resp.find("0 triangles") != std::string::npos, "0-triangle diagnostic error");
        std::cout << "PASS: Geometry parse-stl rejected 0-triangle STL with 400 Bad Request." << std::endl;
    }

    // Test D16: Data parse-csv endpoint (POST /api/v1/data/parse-csv)
    {
        const std::string valid_csv =
            "# Provenance: Synthetic analytical distribution\n"
            "node_id,x_m,y_m,z_m,temperature_C\n"
            "1,0.0,0.0,0.0,25.0\n"
            "2,0.1,0.0,0.0,35.0\n"
            "3,0.1,0.05,0.02,45.0\n";
        std::string resp = http_post(port, "/api/v1/data/parse-csv", valid_csv, test_token);
        TEST_ASSERT(resp.find("200 OK") != std::string::npos, "Parse-csv returns 200 OK");
        TEST_ASSERT(resp.find("\"node_count\":3") != std::string::npos, "Parse-csv node_count");
        TEST_ASSERT(resp.find("\"is_synthetic\":true") != std::string::npos, "Parse-csv synthetic detection");
        TEST_ASSERT(resp.find("\"min_temperature_C\":25") != std::string::npos, "Parse-csv min temp");
        TEST_ASSERT(resp.find("\"node_ids\":[") != std::string::npos, "Parse-csv contains node_ids array");
        TEST_ASSERT(resp.find("\"positions\":[") != std::string::npos, "Parse-csv contains positions array");
        TEST_ASSERT(resp.find("\"temperatures_C\":[") != std::string::npos, "Parse-csv contains temperatures array");
        std::cout << "PASS: Data parse-csv endpoint verified with 200 OK and statistics." << std::endl;
    }

    // Test D17: Data parse-csv rejected on unphysical temperature (400 Bad Request)
    {
        const std::string bad_csv =
            "node_id,x_m,y_m,z_m,temperature_C\n"
            "1,0.0,0.0,0.0,-300.0\n";
        std::string resp = http_post(port, "/api/v1/data/parse-csv", bad_csv, test_token);
        TEST_ASSERT(resp.find("400 Bad Request") != std::string::npos, "Unphysical temp returns 400 Bad Request");
        TEST_ASSERT(resp.find("absolute zero") != std::string::npos, "Diagnostic error for absolute zero violation");
        std::cout << "PASS: Data parse-csv rejected unphysical temperature with 400 Bad Request." << std::endl;
    }

    // Test D18: Unauthenticated Parser Endpoints -> Expect 401 Unauthorized
    {
        std::string resp1 = http_post(port, "/api/v1/geometry/parse-stl", "solid x\nendsolid x\n", "");
        TEST_ASSERT(resp1.find("401 Unauthorized") != std::string::npos, "Unauthenticated parse-stl returns 401");
        std::string resp2 = http_post(port, "/api/v1/data/parse-csv", "dummy", "");
        TEST_ASSERT(resp2.find("401 Unauthorized") != std::string::npos, "Unauthenticated parse-csv returns 401");
        std::cout << "PASS: Unauthenticated requests to parsing endpoints strictly rejected with 401 Unauthorized." << std::endl;
    }

    // Test E: Invalid Request Line (only 2 tokens) -> Expect 400 Bad Request
    std::string resp_bad_line = http_raw_exchange(port, "GET /api/v1/health\r\nHost: 127.0.0.1\r\n\r\n");
    TEST_ASSERT(resp_bad_line.find("400 Bad Request") != std::string::npos, "Malformed request line returns 400");
    std::cout << "PASS: Malformed request line returned 400 Bad Request." << std::endl;

    // Test F: Unsupported HTTP Version (HTTP/2.0) -> Expect 505 HTTP Version Not Supported
    std::string resp_bad_ver = http_raw_exchange(port, "GET /api/v1/health HTTP/2.0\r\nHost: 127.0.0.1\r\n\r\n");
    TEST_ASSERT(resp_bad_ver.find("505 HTTP Version Not Supported") != std::string::npos, "HTTP/2.0 returns 505");
    std::cout << "PASS: Unsupported HTTP/2.0 returned 505 HTTP Version Not Supported." << std::endl;

    // Test G: Unsupported HTTP Method (DELETE) -> Expect 405 Method Not Allowed with Allow header
    std::string resp_bad_method = http_raw_exchange(port, "DELETE /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\n\r\n");
    TEST_ASSERT(resp_bad_method.find("405 Method Not Allowed") != std::string::npos, "DELETE returns 405");
    TEST_ASSERT(resp_bad_method.find("Allow: GET, POST, OPTIONS") != std::string::npos, "405 has Allow header");
    std::cout << "PASS: Unsupported DELETE method returned 405 Method Not Allowed with Allow header." << std::endl;

    // Test H: Malformed Header (missing colon) -> Expect 400 Bad Request
    std::string resp_bad_hdr = http_raw_exchange(port,
        "GET /api/v1/health HTTP/1.1\r\nHost 127.0.0.1\r\nX-Session-Token: " + test_token + "\r\n\r\n");
    TEST_ASSERT(resp_bad_hdr.find("400 Bad Request") != std::string::npos, "Malformed header returns 400");
    std::cout << "PASS: Malformed header missing colon returned 400 Bad Request." << std::endl;

    // Test I: Oversized Header (>16 KB limit) -> Expect 431 Request Header Fields Too Large
    std::string huge_hdr(17 * 1024, 'A');
    std::string resp_huge_hdr = http_raw_exchange(port,
        "GET /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-Custom: " + huge_hdr + "\r\n\r\n");
    TEST_ASSERT(resp_huge_hdr.find("431 Request Header Fields Too Large") != std::string::npos, "Oversized header returns 431");
    std::cout << "PASS: Oversized header (>16 KB) returned 431 Request Header Fields Too Large." << std::endl;

    // Test J: Oversized Body (>10 MB Content-Length) -> Expect 413 Payload Too Large
    std::string resp_huge_body = http_raw_exchange(port,
        "POST /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-Session-Token: " + test_token +
        "\r\nContent-Length: 15000000\r\n\r\n");
    TEST_ASSERT(resp_huge_body.find("413 Payload Too Large") != std::string::npos, "Oversized body returns 413");
    std::cout << "PASS: Oversized Content-Length (>10 MB) returned 413 Payload Too Large." << std::endl;

    // Test K: Transfer-Encoding: chunked (unsupported) -> Expect 501 Not Implemented (RFC 7230 §3.3.1)
    std::string resp_chunked = http_raw_exchange(port,
        "POST /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-Session-Token: " + test_token +
        "\r\nTransfer-Encoding: chunked\r\n\r\n0\r\n\r\n");
    TEST_ASSERT(resp_chunked.find("501 Not Implemented") != std::string::npos, "Transfer-Encoding chunked returns 501");
    std::cout << "PASS: Transfer-Encoding: chunked rejected with HTTP 501 Not Implemented (RFC 7230 §3.3.1)." << std::endl;

    // Test L: POST request with missing Content-Length -> Expect 411 Length Required (RFC 7230 §3.3.2)
    std::string resp_missing_cl = http_raw_exchange(port,
        "POST /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\nX-Session-Token: " + test_token + "\r\n\r\n");
    TEST_ASSERT(resp_missing_cl.find("411 Length Required") != std::string::npos, "POST without Content-Length returns 411");
    std::cout << "PASS: POST without Content-Length rejected with HTTP 411 Length Required (RFC 7230 §3.3.2)." << std::endl;

    // Test M: Unknown route -> Expect 404 Not Found
    std::string resp_404 = http_get(port, "/api/v1/nonexistent", test_token);
    TEST_ASSERT(resp_404.find("404 Not Found") != std::string::npos, "Nonexistent route returns 404");
    std::cout << "PASS: Unknown route returned 404 Not Found." << std::endl;

    // Test N: Malformed / incomplete request (socket closed before complete headers)
    {
        socket_t sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        TEST_ASSERT(sock != static_cast<socket_t>(~0), "Socket created");
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
        addr.sin_port = htons(static_cast<uint16_t>(port));
        int res = connect(sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
        TEST_ASSERT(res == 0, "Connect succeeded");
        const char partial[] = "GET /api/v1/health HTTP/1.1\r\nHost: 127.0.0.1\r\n";
        send(sock, partial, static_cast<int>(sizeof(partial) - 1), 0);
#ifdef _WIN32
        closesocket(sock);
#else
        close(sock);
#endif
        // Verify server remains responsive
        std::string r_after = http_get(port, "/api/v1/health", test_token);
        TEST_ASSERT(r_after.find("200 OK") != std::string::npos, "Server responsive after incomplete request");
        std::cout << "PASS: Malformed/incomplete request handled cleanly without wedging server." << std::endl;
    }

    // Test O: Premature client disconnect (socket closed immediately after connect)
    {
        socket_t sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
        TEST_ASSERT(sock != static_cast<socket_t>(~0), "Socket created");
        sockaddr_in addr{};
        addr.sin_family = AF_INET;
        addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
        addr.sin_port = htons(static_cast<uint16_t>(port));
        int res = connect(sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr));
        TEST_ASSERT(res == 0, "Connect succeeded");
#ifdef _WIN32
        closesocket(sock);
#else
        close(sock);
#endif
        std::string r_after = http_get(port, "/api/v1/health", test_token);
        TEST_ASSERT(r_after.find("200 OK") != std::string::npos, "Server responsive after premature disconnect");
        std::cout << "PASS: Premature client disconnect handled cleanly without error." << std::endl;
    }

    // Test P: Concurrent requests (5 simultaneous threads)
    std::atomic<int> success_count{0};
    std::vector<std::thread> workers;
    for (int i = 0; i < 5; ++i) {
        workers.emplace_back([port, test_token, &success_count]() {
            std::string r = http_get(port, "/api/v1/health", test_token);
            if (r.find("200 OK") != std::string::npos) {
                ++success_count;
            }
        });
    }
    for (auto& w : workers) w.join();
    TEST_ASSERT(success_count == 5, "All 5 concurrent requests succeeded");
    std::cout << "PASS: Concurrent requests (5 parallel threads) all succeeded with 200 OK." << std::endl;

    // Test Q: Graceful shutdown with active in-flight client request
    server.set_route("GET", "/api/v1/slow", [](const HttpRequest&) {
        std::this_thread::sleep_for(std::chrono::milliseconds(250));
        Json res;
        res["slow_task"] = "completed";
        return HttpResponse::ok_json(res);
    });

    std::atomic<bool> in_flight_succeeded{false};
    std::thread in_flight_client([port, test_token, &in_flight_succeeded]() {
        std::string r = http_get(port, "/api/v1/slow", test_token);
        if (r.find("200 OK") != std::string::npos && r.find("slow_task") != std::string::npos) {
            in_flight_succeeded = true;
        }
    });

    // Allow the client thread to establish socket and enter handler
    std::this_thread::sleep_for(std::chrono::milliseconds(50));

    // Initiate stop() while request is running in worker thread: stop() must drain worker threads cleanly
    server.stop();
    TEST_ASSERT(!server.is_running(), "Server is no longer running");

    if (in_flight_client.joinable()) {
        in_flight_client.join();
    }
    TEST_ASSERT(in_flight_succeeded, "In-flight request completed successfully during server.stop() drain");
    std::cout << "PASS: Graceful shutdown with active in-flight request drained cleanly." << std::endl;

    // Test R: Repeated Start/Stop Cycle on fresh dynamic ports (no leaked ports or orphaned sockets)
    for (int cycle = 1; cycle <= 2; ++cycle) {
        bool restarted = server.start(false);
        TEST_ASSERT(restarted, "Server restarted on new ephemeral port");
        int new_port = server.get_bound_port();
        TEST_ASSERT(new_port > 0, "Valid new dynamic port");
        server.set_auth_token(test_token);
        std::string r_restart = http_get(new_port, "/api/v1/health", test_token);
        TEST_ASSERT(r_restart.find("200 OK") != std::string::npos, "Restarted server responds 200 OK");
        server.stop();
        TEST_ASSERT(!server.is_running(), "Restarted server stopped");
    }
    std::cout << "PASS: Repeated start/stop cycles verified cleanly across ephemeral ports." << std::endl;
}

#ifdef _WIN32
static std::string find_backend_executable() {
    std::vector<std::string> candidates = {
        "uew_backend.exe",
        "./uew_backend.exe",
        "Release/uew_backend.exe",
        "build/Release/uew_backend.exe",
        "../build/Release/uew_backend.exe"
    };
    for (const auto& path : candidates) {
        DWORD attrs = GetFileAttributesA(path.c_str());
        if (attrs != INVALID_FILE_ATTRIBUTES && !(attrs & FILE_ATTRIBUTE_DIRECTORY)) {
            return path;
        }
    }
    return "";
}

void test_backend_stdin_eof() {
    std::string exe_path = find_backend_executable();
    if (exe_path.empty()) {
        std::cout << "INFO: uew_backend.exe not found in immediate probe paths; skipping stdin EOF subprocess test." << std::endl;
        return;
    }

    HANDLE hStdinRead = NULL;
    HANDLE hStdinWrite = NULL;
    HANDLE hStdoutRead = NULL;
    HANDLE hStdoutWrite = NULL;

    SECURITY_ATTRIBUTES sa{};
    sa.nLength = sizeof(sa);
    sa.bInheritHandle = TRUE;
    sa.lpSecurityDescriptor = NULL;

    BOOL ok1 = CreatePipe(&hStdinRead, &hStdinWrite, &sa, 0);
    SetHandleInformation(hStdinWrite, HANDLE_FLAG_INHERIT, 0);

    BOOL ok2 = CreatePipe(&hStdoutRead, &hStdoutWrite, &sa, 0);
    SetHandleInformation(hStdoutRead, HANDLE_FLAG_INHERIT, 0);

    TEST_ASSERT(ok1 && ok2, "Pipes created successfully");

    STARTUPINFOA si{};
    si.cb = sizeof(si);
    si.hStdInput = hStdinRead;
    si.hStdOutput = hStdoutWrite;
    si.hStdError = GetStdHandle(STD_ERROR_HANDLE);
    si.dwFlags |= STARTF_USESTDHANDLES;

    PROCESS_INFORMATION pi{};
    std::string cmd = exe_path + " --port 0";
    BOOL success = CreateProcessA(
        NULL,
        cmd.data(),
        NULL,
        NULL,
        TRUE,
        0,
        NULL,
        NULL,
        &si,
        &pi
    );

    CloseHandle(hStdinRead);
    CloseHandle(hStdoutWrite);

    TEST_ASSERT(success, "CreateProcess for uew_backend.exe succeeded");

    // Read until [BACKEND READY]
    char buf[512];
    std::string output;
    DWORD bytesRead = 0;
    while (ReadFile(hStdoutRead, buf, sizeof(buf) - 1, &bytesRead, NULL) && bytesRead > 0) {
        buf[bytesRead] = '\0';
        output += buf;
        if (output.find("[BACKEND READY]") != std::string::npos) {
            break;
        }
    }

    TEST_ASSERT(output.find("[BACKEND READY]") != std::string::npos, "Backend announced [BACKEND READY]");
    std::cout << "INFO: Subprocess backend launched and announced readiness." << std::endl;

    // Simulate parent crash / termination by closing stdin write pipe (EOF)
    CloseHandle(hStdinWrite);
    CloseHandle(hStdoutRead);

    // Wait up to 3000ms for backend to detect EOF and exit cleanly
    DWORD wait_res = WaitForSingleObject(pi.hProcess, 3000);
    TEST_ASSERT(wait_res == WAIT_OBJECT_0, "Backend child process exited within 3000ms upon stdin EOF");

    DWORD exit_code = 1;
    GetExitCodeProcess(pi.hProcess, &exit_code);
    CloseHandle(pi.hProcess);
    CloseHandle(pi.hThread);

    TEST_ASSERT(exit_code == 0, "Backend child process exited cleanly with code 0 on stdin EOF");
    std::cout << "PASS: Backend stdin EOF clean termination verified with exit code 0." << std::endl;
}
#endif

int main() {
#ifdef _WIN32
    WSADATA wsa_data;
    WSAStartup(MAKEWORD(2, 2), &wsa_data);
#endif

    try {
        test_json_roundtrip();
        test_constant_time_comparison();
        test_api_lifecycle_and_validation();
#ifdef _WIN32
        test_backend_stdin_eof();
#endif
        std::cout << "\nALL API & SECURITY ACCEPTANCE TESTS PASSED (100%)\n";
    } catch (const std::exception& e) {
        std::cerr << "FAIL: Exception in test: " << e.what() << std::endl;
        return 1;
    }

#ifdef _WIN32
    WSACleanup();
#endif
    return 0;
}
