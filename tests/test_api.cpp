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
