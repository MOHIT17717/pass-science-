#pragma once

#include "Json.h"
#include <string>
#include <map>
#include <functional>
#include <atomic>
#include <thread>
#include <vector>
#include <mutex>
#include <cstdint>

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
using socket_t = SOCKET;
#else
#include <sys/socket.h>
#include <netinet/in.h>
#include <unistd.h>
using socket_t = int;
#endif

namespace uew::api {

struct HttpRequest {
    std::string method;
    std::string path;
    std::map<std::string, std::string> headers;
    std::string body;

    std::string get_header(const std::string& name) const;
};

struct HttpResponse {
    int status_code{200};
    std::string status_text{"OK"};
    std::map<std::string, std::string> headers;
    std::string body;

    static HttpResponse json(int code, const std::string& status, const Json& json_body);
    static HttpResponse ok_json(const Json& json_body);
    static HttpResponse error_json(int code, const std::string& message, const std::string& details = "");
};

using RouteHandler = std::function<HttpResponse(const HttpRequest&)>;

/**
 * Thread-safe, loopback-only HTTP/1.1 microserver.
 * Binds strictly to 127.0.0.1. Handles per-request authentication token validation,
 * request parsing, concurrency, and graceful shutdown.
 */
class HttpServer {
public:
    static constexpr size_t MAX_HEADER_SIZE = 16 * 1024;       // 16 KB header limit
    static constexpr size_t MAX_BODY_SIZE = 10 * 1024 * 1024;  // 10 MB payload limit
    static constexpr int CLIENT_TIMEOUT_MS = 5000;             // 5 seconds socket I/O timeout

    explicit HttpServer(int requested_port = 0);
    ~HttpServer();

    // Configuration
    void set_route(const std::string& method, const std::string& path, RouteHandler handler);
    void set_auth_token(const std::string& token);
    void set_require_auth(bool require);
    bool is_auth_initialized() const;
    int get_bound_port() const;

    // Lifecycle
    bool start(bool blocking = false);
    void stop();
    bool is_running() const;

    // Security mitigation: constant-time comparison mitigation for 64-char session token
    static bool constant_time_equals(const std::string& supplied, const std::string& expected);

private:
    int m_requested_port{0};
    int m_bound_port{0};
    std::string m_auth_token;
    std::atomic<bool> m_token_initialized{false};
    bool m_require_auth{true};
    std::atomic<bool> m_running{false};

    socket_t m_server_sock{static_cast<socket_t>(~0)};
    std::thread m_listen_thread;

    std::atomic<int> m_active_connections{0};
    std::mutex m_threads_mutex;
    std::vector<std::thread> m_worker_threads;

    // Routes: "METHOD PATH" -> Handler
    std::map<std::string, RouteHandler> m_routes;

    void run_listener();
    void handle_client(socket_t client_sock);
    void cleanup_finished_threads();
};

} // namespace uew::api
