#include "HttpServer.h"
#include <iostream>
#include <sstream>
#include <algorithm>
#include <cstring>
#include <chrono>

namespace uew::api {

std::string HttpRequest::get_header(const std::string& name) const {
    std::string lower_name = name;
    std::transform(lower_name.begin(), lower_name.end(), lower_name.begin(), [](unsigned char c) {
        return static_cast<char>(::tolower(c));
    });
    for (const auto& [k, v] : headers) {
        std::string lower_k = k;
        std::transform(lower_k.begin(), lower_k.end(), lower_k.begin(), [](unsigned char c) {
            return static_cast<char>(::tolower(c));
        });
        if (lower_k == lower_name) {
            return v;
        }
    }
    return "";
}

std::string HttpRequest::get_query_param(const std::string& name) const {
    if (query.empty()) return "";
    std::istringstream qs(query);
    std::string pair;
    while (std::getline(qs, pair, '&')) {
        size_t eq = pair.find('=');
        if (eq != std::string::npos) {
            std::string k = pair.substr(0, eq);
            std::string v = pair.substr(eq + 1);
            if (k == name) return v;
        } else if (pair == name) {
            return "true";
        }
    }
    return "";
}

HttpResponse HttpResponse::json(int code, const std::string& status, const Json& json_body) {
    HttpResponse resp;
    resp.status_code = code;
    resp.status_text = status;
    resp.headers["Content-Type"] = "application/json; charset=utf-8";
    resp.body = json_body.serialize();
    return resp;
}

HttpResponse HttpResponse::ok_json(const Json& json_body) {
    return json(200, "OK", json_body);
}

HttpResponse HttpResponse::error_json(int code, const std::string& message, const std::string& details) {
    Json err;
    err["error"] = message;
    err["code"] = code;
    if (!details.empty()) {
        err["details"] = details;
    }
    std::string text = "Error";
    if (code == 400) text = "Bad Request";
    else if (code == 401) text = "Unauthorized";
    else if (code == 404) text = "Not Found";
    else if (code == 405) text = "Method Not Allowed";
    else if (code == 411) text = "Length Required";
    else if (code == 413) text = "Payload Too Large";
    else if (code == 431) text = "Request Header Fields Too Large";
    else if (code == 500) text = "Internal Server Error";
    else if (code == 501) text = "Not Implemented";
    else if (code == 503) text = "Service Unavailable";
    else if (code == 505) text = "HTTP Version Not Supported";
    return json(code, text, err);
}

HttpServer::HttpServer(int requested_port)
    : m_requested_port(requested_port)
{
#ifdef _WIN32
    WSADATA wsa_data;
    WSAStartup(MAKEWORD(2, 2), &wsa_data);
#endif
}

HttpServer::~HttpServer() {
    stop();
#ifdef _WIN32
    WSACleanup();
#endif
}

void HttpServer::set_route(const std::string& method, const std::string& path, RouteHandler handler) {
    std::string key = method + " " + path;
    m_routes[key] = std::move(handler);
}

void HttpServer::set_auth_token(const std::string& token) {
    m_auth_token = token;
    m_token_initialized = true;
}

void HttpServer::set_require_auth(bool require) {
    m_require_auth = require;
}

bool HttpServer::is_auth_initialized() const {
    return m_token_initialized;
}

int HttpServer::get_bound_port() const {
    return m_bound_port;
}

/**
 * Constant-time byte-comparison software mitigation for 64-character hexadecimal session tokens.
 *
 * Security Design & Timing Mitigation:
 * - Always iterates through all 64 positions of the expected token.
 * - Character accesses are safely bounds-checked to avoid reading out of bounds on shorter strings.
 * - Length discrepancies (both between strings and against the expected 64-character length)
 *   are bitwise OR'd into a volatile accumulator without branching early.
 * - Prefix matches do not trigger early exit: the full 64 iterations always execute.
 *
 * Limitations:
 * - This function is a software-level timing-side-channel mitigation against remote network/IPC
 *   timing measurement. It does not provide absolute hardware-level cache-timing or speculative
 *   execution resistance.
 */
bool HttpServer::constant_time_equals(const std::string& supplied, const std::string& expected) {
    constexpr size_t EXPECTED_LEN = 64;
    volatile unsigned int diff = 0;

    // Incorporate length mismatches into accumulated difference without early exit
    diff |= static_cast<unsigned int>(supplied.size() ^ expected.size());
    diff |= static_cast<unsigned int>(expected.size() ^ EXPECTED_LEN);

    // Always process exactly 64 positions corresponding to the expected session token
    for (size_t i = 0; i < EXPECTED_LEN; ++i) {
        char s = (i < supplied.size()) ? supplied[i] : '\0';
        char e = (i < expected.size()) ? expected[i] : '\0';
        diff |= static_cast<unsigned int>(static_cast<unsigned char>(s) ^ static_cast<unsigned char>(e));
    }

    return diff == 0;
}

bool HttpServer::start(bool blocking) {
    if (m_running) return true;

    m_server_sock = socket(AF_INET, SOCK_STREAM, IPPROTO_TCP);
    if (m_server_sock == static_cast<socket_t>(~0)) {
        std::cerr << "[BACKEND ERROR] Failed to create socket." << std::endl;
        return false;
    }

    int opt = 1;
#ifdef _WIN32
    setsockopt(m_server_sock, SOL_SOCKET, SO_REUSEADDR, reinterpret_cast<const char*>(&opt), sizeof(opt));
#else
    setsockopt(m_server_sock, SOL_SOCKET, SO_REUSEADDR, &opt, sizeof(opt));
#endif

    sockaddr_in addr{};
    addr.sin_family = AF_INET;
    // Strictly loopback only (127.0.0.1)
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK);
    addr.sin_port = htons(static_cast<uint16_t>(m_requested_port));

    if (bind(m_server_sock, reinterpret_cast<sockaddr*>(&addr), sizeof(addr)) != 0) {
        std::cerr << "[BACKEND ERROR] Failed to bind to 127.0.0.1:" << m_requested_port << std::endl;
#ifdef _WIN32
        closesocket(m_server_sock);
#else
        close(m_server_sock);
#endif
        m_server_sock = static_cast<socket_t>(~0);
        return false;
    }

    // Determine actual bound port (crucial when requested_port == 0)
    sockaddr_in bound_addr{};
    int len = sizeof(bound_addr);
    if (getsockname(m_server_sock, reinterpret_cast<sockaddr*>(&bound_addr), &len) == 0) {
        m_bound_port = ntohs(bound_addr.sin_port);
    } else {
        m_bound_port = m_requested_port;
    }

    if (listen(m_server_sock, SOMAXCONN) != 0) {
        std::cerr << "[BACKEND ERROR] Failed to listen on socket." << std::endl;
        return false;
    }

    m_running = true;

    if (blocking) {
        run_listener();
    } else {
        m_listen_thread = std::thread(&HttpServer::run_listener, this);
    }

    return true;
}

void HttpServer::stop() {
    if (!m_running) return;
    m_running = false;

    // Unblock accept() by closing server socket
    if (m_server_sock != static_cast<socket_t>(~0)) {
#ifdef _WIN32
        closesocket(m_server_sock);
#else
        close(m_server_sock);
#endif
        m_server_sock = static_cast<socket_t>(~0);
    }

    if (m_listen_thread.joinable()) {
        m_listen_thread.join();
    }

    // Drain and join all worker threads
    std::lock_guard<std::mutex> lock(m_threads_mutex);
    for (auto& t : m_worker_threads) {
        if (t.joinable()) {
            t.join();
        }
    }
    m_worker_threads.clear();
}

bool HttpServer::is_running() const {
    return m_running;
}

void HttpServer::cleanup_finished_threads() {
    std::lock_guard<std::mutex> lock(m_threads_mutex);
    // Remove threads that are not joinable or can be cleaned up
    // In our synchronous/worker design, we join on stop()
}

void HttpServer::run_listener() {
    while (m_running) {
        sockaddr_in client_addr{};
        int client_len = sizeof(client_addr);
        socket_t client_sock = accept(m_server_sock, reinterpret_cast<sockaddr*>(&client_addr), &client_len);

        if (client_sock == static_cast<socket_t>(~0)) {
            // Server socket was closed to interrupt accept()
            break;
        }

        // Spawn a dedicated thread for concurrent request processing
        {
            std::lock_guard<std::mutex> lock(m_threads_mutex);
            m_worker_threads.emplace_back(&HttpServer::handle_client, this, client_sock);
        }
    }
}

void HttpServer::handle_client(socket_t client_sock) {
    ++m_active_connections;

    // Apply client socket timeout (5 seconds)
#ifdef _WIN32
    DWORD timeout_ms = CLIENT_TIMEOUT_MS;
    setsockopt(client_sock, SOL_SOCKET, SO_RCVTIMEO, reinterpret_cast<const char*>(&timeout_ms), sizeof(timeout_ms));
    setsockopt(client_sock, SOL_SOCKET, SO_SNDTIMEO, reinterpret_cast<const char*>(&timeout_ms), sizeof(timeout_ms));
#else
    struct timeval tv;
    tv.tv_sec = CLIENT_TIMEOUT_MS / 1000;
    tv.tv_usec = (CLIENT_TIMEOUT_MS % 1000) * 1000;
    setsockopt(client_sock, SOL_SOCKET, SO_RCVTIMEO, &tv, sizeof(tv));
    setsockopt(client_sock, SOL_SOCKET, SO_SNDTIMEO, &tv, sizeof(tv));
#endif

    auto send_and_close = [&](const HttpResponse& resp) {
        std::ostringstream out;
        out << "HTTP/1.1 " << resp.status_code << " " << resp.status_text << "\r\n";
        for (const auto& [k, v] : resp.headers) {
            out << k << ": " << v << "\r\n";
        }
        out << "Access-Control-Allow-Origin: *\r\n";
        out << "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n";
        out << "Access-Control-Allow-Headers: Content-Type, X-Session-Token, Authorization\r\n";
        out << "Connection: close\r\n";
        out << "Content-Length: " << resp.body.size() << "\r\n\r\n";
        out << resp.body;

        std::string res_str = out.str();
        send(client_sock, res_str.data(), static_cast<int>(res_str.size()), 0);

#ifdef _WIN32
        shutdown(client_sock, SD_SEND);
        char drain_buf[1024];
        DWORD drain_timeout = 200;
        setsockopt(client_sock, SOL_SOCKET, SO_RCVTIMEO, reinterpret_cast<const char*>(&drain_timeout), sizeof(drain_timeout));
        while (recv(client_sock, drain_buf, sizeof(drain_buf), 0) > 0) {}
        closesocket(client_sock);
#else
        shutdown(client_sock, SHUT_WR);
        char drain_buf[1024];
        while (recv(client_sock, drain_buf, sizeof(drain_buf), 0) > 0) {}
        close(client_sock);
#endif
        --m_active_connections;
    };

    std::string raw_request;
    char buffer[4096];
    size_t header_end = std::string::npos;

    // 1. Read headers with strict size limit
    while (m_running) {
        int bytes = recv(client_sock, buffer, sizeof(buffer) - 1, 0);
        if (bytes <= 0) break;
        buffer[bytes] = '\0';
        raw_request.append(buffer, bytes);

        header_end = raw_request.find("\r\n\r\n");
        if (header_end != std::string::npos) {
            if (header_end > MAX_HEADER_SIZE) {
                send_and_close(HttpResponse::error_json(431, "Request Header Fields Too Large",
                    "Header size exceeds maximum limit of 16 KB."));
                return;
            }
            break;
        }

        if (raw_request.size() > MAX_HEADER_SIZE) {
            send_and_close(HttpResponse::error_json(431, "Request Header Fields Too Large",
                "Header size exceeds maximum limit of 16 KB."));
            return;
        }
    }

    if (header_end == std::string::npos) {
        // Client disconnected before sending complete headers
#ifdef _WIN32
        closesocket(client_sock);
#else
        close(client_sock);
#endif
        --m_active_connections;
        return;
    }

    std::string header_str = raw_request.substr(0, header_end);
    std::string body_start = raw_request.substr(header_end + 4);

    std::istringstream stream(header_str);
    std::string request_line;
    if (!std::getline(stream, request_line)) {
        send_and_close(HttpResponse::error_json(400, "Bad Request", "Empty request line."));
        return;
    }

    if (!request_line.empty() && request_line.back() == '\r') {
        request_line.pop_back();
    }

    // 2. Validate request line: METHOD PATH VERSION
    std::istringstream req_stream(request_line);
    std::string method, path, version;
    if (!(req_stream >> method >> path >> version)) {
        send_and_close(HttpResponse::error_json(400, "Bad Request", "Malformed request line. Expected: METHOD PATH VERSION."));
        return;
    }

    if (version.rfind("HTTP/1.", 0) != 0) {
        send_and_close(HttpResponse::error_json(505, "HTTP Version Not Supported", "Only HTTP/1.0 and HTTP/1.1 are supported."));
        return;
    }

    if (method != "GET" && method != "POST" && method != "OPTIONS") {
        HttpResponse resp = HttpResponse::error_json(405, "Method Not Allowed", "Allowed methods: GET, POST, OPTIONS.");
        resp.headers["Allow"] = "GET, POST, OPTIONS";
        send_and_close(resp);
        return;
    }

    HttpRequest req;
    req.method = method;
    req.path = path;

    // Parse query params out of path
    size_t query_pos = req.path.find('?');
    if (query_pos != std::string::npos) {
        req.query = req.path.substr(query_pos + 1);
        req.path = req.path.substr(0, query_pos);
    }

    // 3. Parse and validate headers
    std::string header_line;
    while (std::getline(stream, header_line)) {
        if (!header_line.empty() && header_line.back() == '\r') header_line.pop_back();
        if (header_line.empty()) continue;

        size_t colon = header_line.find(':');
        if (colon == std::string::npos) {
            send_and_close(HttpResponse::error_json(400, "Bad Request", "Malformed header line: missing colon delimiter."));
            return;
        }

        std::string key = header_line.substr(0, colon);
        std::string val = header_line.substr(colon + 1);
        while (!val.empty() && (val.front() == ' ' || val.front() == '\t')) val.erase(val.begin());
        req.headers[key] = val;
    }

    // 4. Validate body framing and size limit (RFC 7230 §3.3.1, §3.3.2)
    std::string te = req.get_header("Transfer-Encoding");
    if (!te.empty()) {
        send_and_close(HttpResponse::error_json(501, "Not Implemented",
            "Chunked transfer encoding is not supported. Use Content-Length."));
        return;
    }

    std::string cl_str = req.get_header("Content-Length");
    if (req.method == "POST" && cl_str.empty()) {
        send_and_close(HttpResponse::error_json(411, "Length Required",
            "POST requests require a Content-Length header."));
        return;
    }

    size_t content_length = 0;
    if (!cl_str.empty()) {
        try {
            content_length = std::stoull(cl_str);
        } catch (...) {
            send_and_close(HttpResponse::error_json(400, "Bad Request", "Invalid Content-Length header."));
            return;
        }

        if (content_length > MAX_BODY_SIZE) {
            send_and_close(HttpResponse::error_json(413, "Payload Too Large", "Request body exceeds maximum limit of 10 MB."));
            return;
        }
    }

    // 5. Read body
    req.body = body_start;
    while (req.body.size() < content_length && m_running) {
        int to_read = static_cast<int>((std::min)(sizeof(buffer) - 1, content_length - req.body.size()));
        int bytes = recv(client_sock, buffer, to_read, 0);
        if (bytes <= 0) {
            // Premature client disconnect during body transmission
#ifdef _WIN32
            closesocket(client_sock);
#else
            close(client_sock);
#endif
            --m_active_connections;
            return;
        }
        req.body.append(buffer, bytes);
    }

    // 6. Handle CORS preflight
    if (req.method == "OPTIONS") {
        HttpResponse resp;
        resp.status_code = 204;
        resp.status_text = "No Content";
        send_and_close(resp);
        return;
    }

    // 7. Enforce authentication and initialization check
    if (m_require_auth) {
        if (!m_token_initialized) {
            send_and_close(HttpResponse::error_json(503, "Service Unavailable",
                "Backend token initialization in progress. Please wait for startup handshake."));
            return;
        }

        std::string provided_token = req.get_header("X-Session-Token");
        if (provided_token.empty()) {
            std::string auth_hdr = req.get_header("Authorization");
            if (auth_hdr.rfind("Bearer ", 0) == 0) {
                provided_token = auth_hdr.substr(7);
            }
        }

        if (provided_token.empty() || !constant_time_equals(provided_token, m_auth_token)) {
            send_and_close(HttpResponse::error_json(401, "Unauthorized", "Invalid or missing session authentication token."));
            return;
        }
    }

    // 8. Dispatch to registered route
    std::string route_key = req.method + " " + req.path;
    auto it = m_routes.find(route_key);
    if (it != m_routes.end()) {
        try {
            HttpResponse resp = it->second(req);
            send_and_close(resp);
        } catch (const std::exception& ex) {
            send_and_close(HttpResponse::error_json(500, "Internal Server Error", ex.what()));
        }
    } else {
        send_and_close(HttpResponse::error_json(404, "Not Found", "No route registered for " + route_key));
    }
}

} // namespace uew::api
